import type {
  AdminSpaceListItem,
  CreateSpaceInput,
  UpdateSpaceInput,
} from '../entities/admin-space.entity';

export const ADMIN_SPACE_REPOSITORY = 'IAdminSpaceRepository';

export interface IAdminSpaceRepository {
  list(): Promise<AdminSpaceListItem[]>;
  create(input: CreateSpaceInput): Promise<AdminSpaceListItem>;
  update(id: string, input: UpdateSpaceInput): Promise<AdminSpaceListItem | null>;
  delete(id: string): Promise<boolean>;
  attachEquipement(spaceId: string, equipementId: string, quantity?: number): Promise<{ id: string }>;
  detachEquipement(spaceId: string, equipementId: string, quantity?: number): Promise<boolean>;
}
