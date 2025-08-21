export interface EquipOptions {
  preset?: PresetType;
  yes?: boolean;
  filter?: string;
  workspaceRoot?: boolean;
}

export interface PackageSelection {
  configs: Array<string>;
  utils: Array<string>;
  fieldguides: Array<string>;
}

export interface Package {
  name: string;
  value: string;
  selected: boolean;
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type PresetType = 'minimal' | 'standard' | 'full';

export interface InstallCommand {
  command: string;
  installVerb: string;
  devFlag: string;
}
