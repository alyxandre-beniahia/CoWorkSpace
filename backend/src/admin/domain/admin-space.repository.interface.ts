export type AdminSpaceListItem = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  capacity: number;
  status: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  equipements: { id: string; name: string; quantity: number }[];
};

export type CreateSpaceInput = {
  name: string;
  code?: string | null;
  type: string;
  capacity: number;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
};

export type UpdateSpaceInput = Partial<CreateSpaceInput> & {
  status?: string;
};

export interface IAdminSpaceRepository {
  list(): Promise<AdminSpaceListItem[]>;
  create(input: CreateSpaceInput): Promise<AdminSpaceListItem>;
  update(id: string, input: UpdateSpaceInput): Promise<AdminSpaceListItem | null>;
  delete(id: string): Promise<boolean>;
  attachEquipement(spaceId: string, equipementId: string, quantity?: number): Promise<{ id: string }>;
  detachEquipement(spaceId: string, equipementId: string, quantity?: number): Promise<boolean>;
}
