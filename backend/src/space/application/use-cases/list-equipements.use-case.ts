import type { IEquipementLister, EquipementItem } from '../ports/equipement-lister.port';

export class ListEquipementsUseCase {
  constructor(private readonly equipementLister: IEquipementLister) {}

  async run(): Promise<EquipementItem[]> {
    return this.equipementLister.list();
  }
}
