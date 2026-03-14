export type EquipementListItem = {
  id: string;
  name: string;
  quantity: number;
  assigned?: number;
  available?: number;
};

export type EquipementAvailability = {
  total: number;
  assigned: number;
  available: number;
};

export type CreateEquipementInput = {
  name: string;
  quantity?: number;
};

export type UpdateEquipementInput = {
  name?: string;
  quantity?: number;
};

export interface IAdminEquipementRepository {
  list(): Promise<EquipementListItem[]>;
  create(input: CreateEquipementInput): Promise<EquipementListItem>;
  update(id: string, input: UpdateEquipementInput): Promise<EquipementListItem | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<EquipementListItem | null>;
  getAssignedQuantity(equipementId: string): Promise<number>;
}
