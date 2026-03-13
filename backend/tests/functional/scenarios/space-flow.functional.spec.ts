import { createTestApp } from '../setup/test-app';

describe('Parcours space (fonctionnel)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let req: Awaited<ReturnType<typeof createTestApp>>['request'];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    req = testApp.request;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET / (health) → GET /spaces/equipments (public) → GET /spaces (filtres) → GET /spaces/:id', async () => {
    const healthRes = await req.get('/').expect(200);
    expect(healthRes.body).toHaveProperty('message');

    const equipRes = await req.get('/spaces/equipments').expect(200);
    expect(Array.isArray(equipRes.body)).toBe(true);

    const listRes = await req.get('/spaces').expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);

    const filteredByType = await req
      .get('/spaces?type=MEETING_ROOM')
      .expect(200);
    expect(Array.isArray(filteredByType.body)).toBe(true);

    const filteredByCapacity = await req
      .get('/spaces?capacityMin=6&capacityMax=10')
      .expect(200);
    expect(Array.isArray(filteredByCapacity.body)).toBe(true);

    if (equipRes.body.length > 0) {
      const filteredByEquipement = await req
        .get(`/spaces?equipementId=${equipRes.body[0].id}`)
        .expect(200);
      expect(Array.isArray(filteredByEquipement.body)).toBe(true);
    }

    const spaceId = listRes.body[0].id;
    const detailRes = await req.get(`/spaces/${spaceId}`).expect(200);
    expect(detailRes.body).toHaveProperty('id', spaceId);
    expect(detailRes.body).toHaveProperty('name');
    expect(detailRes.body).toHaveProperty('type');
    expect(detailRes.body).toHaveProperty('capacity');
  });

  it('404 : GET /spaces/:id avec id inexistant', async () => {
    const fakeId = 'clnonexistentid12345678901234';
    const res = await req.get(`/spaces/${fakeId}`).expect(404);
    expect(res.body.message).toContain('trouvé');
  });
});
