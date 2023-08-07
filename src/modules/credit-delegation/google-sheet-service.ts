import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';

interface GoogleSheetsConnection {
  rows: GoogleSpreadsheetRow[];
  sheet: GoogleSpreadsheetWorksheet;
  releaseSheet: () => void;
}

const cleanUpStringValue = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue && `'${trimmedValue}`;
};

const cleanUpObject = (data: Record<string, string | number | boolean>) =>
  Object.entries(data).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = cleanUpStringValue(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string | number | boolean>);

export class GoogleSheetsApiService {
  protected sheets: Record<string, GoogleSheetsConnection> = {};
  protected sheetId: string;

  constructor(sheetId: string) {
    this.sheetId = sheetId;
  }

  public async getSheet(sheetName: string): Promise<GoogleSheetsConnection> {
    const key = `GoogleSheets_getSheet_${sheetName}`;
    const item = this.sheets[key];

    if (item) {
      return item;
    }

    const conn = this.connectToGoogleSheets(this.sheetId, sheetName);

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

      const releaseSheet = () => {
        delete this.sheets[spreadsheetId];
      };

      return { rows, sheet, releaseSheet };
    } catch (e) {
      console.error('Error: ', e);

      throw e;
    }
  }

  public async addRow(
    connection: GoogleSheetsConnection,
    data: Record<string, string | number | boolean>
  ) {
    return connection.sheet.addRow(cleanUpObject(data));
  }

  public async updateRow(
    row: GoogleSpreadsheetRow,
    data: Record<string, string | number | boolean>
  ) {
    const cleanObject = cleanUpObject(data);

    Object.entries(cleanObject).forEach(([key, value]) => {
      row[key] = value;
    });

    return row.save();
  }
}
