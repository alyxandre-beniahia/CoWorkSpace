import type { CreateSpaceDto } from './create-space.dto';

export type UpdateSpaceDto = Partial<CreateSpaceDto> & {
  status?: string;
};
