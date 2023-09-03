import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon from 'argon2';
import * as request from 'supertest';

describe('RideController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  describe('Rides', () => {
    beforeEach(async () => {
      try {
        const user = await prisma.user.create({
          data: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'test1@email.com',
            phone: '1234567891',
            password: await argon.hash('password'),
          },
        });

        const ride = await prisma.ride.create({
          data: {
            user_id: user.id,
            latitute: 0,
            longitude: 0,
          },
        });
      } catch (e) {
        console.log(e);
      }
    });
    it('should return a list of rides', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send({ phone: '1234567891', password: 'password' });
      const token = loginResponse.body.token;

      console.log(token);

      const response = await request(app.getHttpServer())
        .get('/rides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      console.log(response.body);
    });

    it('should accept a ride', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send({ phone: '1234567891', password: 'password' });
      const token = loginResponse.body.token;

      const response = await request(app.getHttpServer())
        .put('/rides/1/accept')
        .set('Authorization', `Bearer ${token}`)
        .send({ driver_id: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('accepted');
    });

    afterEach(async () => {
      await prisma.user.deleteMany();
      await prisma.ride.deleteMany();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
