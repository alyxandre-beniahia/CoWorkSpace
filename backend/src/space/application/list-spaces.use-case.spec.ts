import { Test, TestingModule } from '@nestjs/testing';
import { SpaceRepository } from '../infrastructure/space.repository';
import { ListSpacesUseCase } from './list-spaces.use-case';

describe('ListSpacesUseCase', () => {
  let useCase: ListSpacesUseCase;
  let repository: jest.Mocked<Pick<SpaceRepository, 'list'>>;

  const mockSpaces = [
    {
      id: 'space-1',
      name: 'Salle A',
      code: 'A01',
      type: 'MEETING_ROOM',
      capacity: 8,
      status: 'AVAILABLE',
      equipements: ['Vidéoprojecteur', 'Tableau'],
    },
  ];

  beforeEach(async () => {
    repository = {
      list: jest.fn().mockResolvedValue(mockSpaces),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListSpacesUseCase,
        { provide: SpaceRepository, useValue: repository },
      ],
    }).compile();

    useCase = module.get(ListSpacesUseCase);
  });

  it('retourne la liste des espaces du repository', async () => {
    const result = await useCase.run({});

    expect(result).toEqual(mockSpaces);
    expect(repository.list).toHaveBeenCalledWith({});
  });

  it('passe les filtres (type, equipementId, capacityMin, capacityMax) au repository', async () => {
    await useCase.run({
      type: 'MEETING_ROOM',
      equipementId: 'eq-1',
      capacityMin: 4,
      capacityMax: 10,
    });

    expect(repository.list).toHaveBeenCalledWith({
      type: 'MEETING_ROOM',
      equipementId: 'eq-1',
      capacityMin: 4,
      capacityMax: 10,
    });
  });
});
