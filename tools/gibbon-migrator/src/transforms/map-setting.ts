import { GibbonSettingRow } from "../gibbon-types";

export interface MappedSetting {
  id: string;
  schoolId: string;
  scope: string;
  name: string;
  nameDisplay: string;
  description: string | null;
  value: string;
}

export function mapSetting(
  row: GibbonSettingRow,
  id: string,
  schoolId: string,
): MappedSetting {
  return {
    id,
    schoolId,
    scope: row.scope,
    name: row.name,
    nameDisplay: row.nameDisplay,
    description: row.description.trim() === "" ? null : row.description,
    value: row.value,
  };
}
