import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';

import { CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID } from './consts';

interface Sheet {
  rows: GoogleSpreadsheetRow[];
  sheet: GoogleSpreadsheetWorksheet;
}

class GoogleSheetsApiService {
  protected sheets: Record<string, Sheet> = {};

  public async getSheet(sheetName: string): Promise<Sheet> {
    const key = `GoogleSheets_getSheet_${sheetName}`;
    const item = this.sheets[key];

    if (item) {
      return item;
    }

    const conn = this.connectToGoogleSheets(CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID, sheetName);

    this.sheets[key] = await conn;

    return conn;
  }

  public releaseSheet(sheetName: string) {
    const key = `GoogleSheets_getSheet_${sheetName}`;

    delete this.sheets[key];
  }

  public async connectToGoogleSheets(spreadsheetId: string, sheetTitle: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const credentials = require('../../../sheets-credentials.json');

    const doc = new GoogleSpreadsheet(spreadsheetId);

    try {
      await doc.useServiceAccountAuth(credentials);

      await doc.loadInfo();

      const sheet = doc.sheetsByTitle[sheetTitle];

      if (!sheet) {
        throw new Error(`Sheet with name '${sheetTitle}' was not found`);
      }

      const rows = await sheet.getRows();

      return { rows, sheet };
    } catch (e) {
      console.error('Error: ', e);

      throw e;
    }
  }

  public async addRowSafely(
    connection: {
      rows: GoogleSpreadsheetRow[];
      sheet: GoogleSpreadsheetWorksheet;
    },
    data: Record<string, string>
  ) {
    const safeData = Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = `'${value}`;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    return connection.sheet.addRow(safeData);
  }
}

const instance = new GoogleSheetsApiService();

export default instance;
