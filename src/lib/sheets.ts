/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Transaction, TransactionType } from '../types';

const SPREADSHEET_NAME = 'ระบบบัญชีและงบประมาณไซงานก่อสร้าง';

/**
 * Search the user's Google Drive for an existing spreadsheet with our name
 */
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error finding spreadsheet in Drive:', errorText);
      throw new Error(`Drive API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('findSpreadsheet error:', error);
    throw error;
  }
}

/**
 * Create a new spreadsheet with a default _Config sheet and headers
 */
export async function createSpreadsheet(accessToken: string, customName?: string): Promise<string> {
  try {
    const title = customName || SPREADSHEET_NAME;
    // 1. Create Spreadsheet
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
        sheets: [
          {
            properties: {
              title: '_Config',
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error creating spreadsheet:', errorText);
      throw new Error(`Sheets API create error: ${res.statusText}`);
    }

    const spreadsheet = await res.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // 2. Add config headers
    const headers = [
      'Project Name',
      'Total Budget',
      'Description',
      'Concrete Budget',
      'Steel Budget',
      'Wood Budget',
      'Electrical Budget',
      'Plumbing Budget',
      'Labor Budget',
      'Others Budget',
    ];

    await updateSheetRange(
      spreadsheetId,
      '_Config!A1:J1',
      [headers],
      accessToken
    );

    return spreadsheetId;
  } catch (error) {
    console.error('createSpreadsheet error:', error);
    throw error;
  }
}

/**
 * Fetch all sheets (tabs) in a spreadsheet to verify if tabs exist
 */
export async function getSpreadsheetSheets(spreadsheetId: string, accessToken: string): Promise<string[]> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Fetch sheet titles failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.sheets?.map((s: any) => s.properties.title) || [];
  } catch (error) {
    console.error('getSpreadsheetSheets error:', error);
    return [];
  }
}

/**
 * Fetch the list of projects from the _Config sheet
 */
export async function fetchProjects(spreadsheetId: string, accessToken: string): Promise<Project[]> {
  try {
    const range = '_Config!A2:J100';
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch projects API failure:', errorText);
      throw new Error(`Fetch projects failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.values || data.values.length === 0) {
      return [];
    }

    return data.values.map((row: any[]) => {
      return {
        name: row[0] || '',
        totalBudget: Number(row[1]) || 0,
        description: row[2] || '',
        categoryBudgets: {
          concrete: Number(row[3]) || 0,
          steel: Number(row[4]) || 0,
          wood: Number(row[5]) || 0,
          electrical: Number(row[6]) || 0,
          plumbing: Number(row[7]) || 0,
          labor: Number(row[8]) || 0,
          others: Number(row[9]) || 0,
        },
      };
    }).filter((p: Project) => p.name !== '');
  } catch (error) {
    console.error('fetchProjects error:', error);
    throw error;
  }
}

/**
 * Create a new project row in _Config and create its separate sheet tab
 */
export async function saveProject(spreadsheetId: string, project: Project, accessToken: string): Promise<void> {
  try {
    // 1. Verify if sheet already exists
    const existingSheets = await getSpreadsheetSheets(spreadsheetId, accessToken);
    
    // Check if the project is already in _Config
    const projects = await fetchProjects(spreadsheetId, accessToken);
    const projectExists = projects.some(p => p.name.trim().toLowerCase() === project.name.trim().toLowerCase());

    if (!projectExists) {
      // Append to _Config
      const row = [
        project.name,
        project.totalBudget,
        project.description,
        project.categoryBudgets.concrete,
        project.categoryBudgets.steel,
        project.categoryBudgets.wood,
        project.categoryBudgets.electrical,
        project.categoryBudgets.plumbing,
        project.categoryBudgets.labor,
        project.categoryBudgets.others,
      ];

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/_Config!A1:J1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      });

      if (!appendRes.ok) {
        throw new Error(`Failed to append project to _Config: ${appendRes.statusText}`);
      }
    }

    // 2. Add sheet tab if it doesn't exist
    if (!existingSheets.includes(project.name)) {
      const createSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: project.name,
                },
              },
            },
          ],
        }),
      });

      if (!createSheetRes.ok) {
        throw new Error(`Failed to create sheet for project ${project.name}: ${createSheetRes.statusText}`);
      }

      // Add transaction headers to the new sheet tab
      const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Reference No', 'Notes'];
      await updateSheetRange(
        spreadsheetId,
        `'${project.name}'!A1:H1`,
        [headers],
        accessToken
      );
    }
  } catch (error) {
    console.error('saveProject error:', error);
    throw error;
  }
}

/**
 * Fetch all transactions for a specific project sheet tab
 */
export async function fetchTransactions(spreadsheetId: string, projectName: string, accessToken: string): Promise<Transaction[]> {
  try {
    const range = `'${projectName}'!A2:H1500`;
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // If the sheet doesn't exist or isn't accessible, return empty array
      return [];
    }

    const data = await res.json();
    if (!data.values || data.values.length === 0) {
      return [];
    }

    return data.values.map((row: any[]) => {
      return {
        id: row[0] || '',
        date: row[1] || '',
        type: (row[2] || 'Expense') as TransactionType,
        category: row[3] || '',
        description: row[4] || '',
        amount: Number(row[5]) || 0,
        referenceNo: row[6] || '',
        notes: row[7] || '',
      };
    }).filter((t: Transaction) => t.id !== '');
  } catch (error) {
    console.error(`fetchTransactions for ${projectName} error:`, error);
    return [];
  }
}

/**
 * Append a transaction to a project's sheet tab
 */
export async function saveTransaction(spreadsheetId: string, projectName: string, transaction: Transaction, accessToken: string): Promise<void> {
  try {
    const row = [
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.description,
      transaction.amount,
      transaction.referenceNo,
      transaction.notes,
    ];

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${projectName}'!A1:H1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Append transaction API failure:', errorText);
      throw new Error(`Failed to save transaction: ${res.statusText}`);
    }
  } catch (error) {
    console.error('saveTransaction error:', error);
    throw error;
  }
}

/**
 * Delete a transaction from a project's sheet tab
 */
export async function deleteTransaction(spreadsheetId: string, projectName: string, transactionId: string, accessToken: string): Promise<void> {
  try {
    const transactions = await fetchTransactions(spreadsheetId, projectName, accessToken);
    const filtered = transactions.filter(t => t.id !== transactionId);

    // 1. Clear the entire project tab starting from row 2
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${projectName}'!A2:H1500:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!clearRes.ok) {
      throw new Error(`Failed to clear range before rewrite: ${clearRes.statusText}`);
    }

    // 2. If there are remaining transactions, write them back
    if (filtered.length > 0) {
      const rows = filtered.map(t => [
        t.id,
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
        t.referenceNo,
        t.notes,
      ]);

      await updateSheetRange(
        spreadsheetId,
        `'${projectName}'!A2:H${filtered.length + 1}`,
        rows,
        accessToken
      );
    }
  } catch (error) {
    console.error('deleteTransaction error:', error);
    throw error;
  }
}

/**
 * Helper to update values in a range of cells
 */
async function updateSheetRange(
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Update sheet range ${range} failed:`, errorText);
    throw new Error(`Update sheet range failed: ${res.statusText}`);
  }
}

/**
 * List the user's Google Spreadsheets from Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<Array<{ id: string; name: string; modifiedTime?: string }>> {
  try {
    const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=50`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error listing spreadsheets in Drive:', errorText);
      throw new Error(`Drive API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('listUserSpreadsheets error:', error);
    throw error;
  }
}
