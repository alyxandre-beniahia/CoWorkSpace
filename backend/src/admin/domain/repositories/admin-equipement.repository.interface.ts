import type {
  EquipementListItem,
  EquipementAvailability,
  CreateEquipementInput,
  UpdateEquipementInput,
} from '../entities/admin-equipement.entity';

export const ADMIN_EQUIPEMENT_REPOSITORY = 'IAdminEquipementRepository';

export interface IAdminEquipementRepository {
  list(): Promise<EquipementListItem[]>;
  create(input: CreateEquipementInput): Promise<EquipementListItem>;
  update(id: string, input: UpdateEquipementInput): Promise<EquipementListItem | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<EquipementListItem | null>;
  getAssignedQuantity(equipementId: string): Promise<number>;
}

export type { EquipementAvailability };
