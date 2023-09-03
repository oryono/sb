import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon from 'argon2';

describe('AuthController (e2e)', () => {
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

  beforeEach(async () => {
    try {
      await prisma.user.create({
        data: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'test@email.com',
          phone: '1234567890',
          password: await argon.hash('password'),
        },
      });
    } catch (e) {}
  });

  describe('login', () => {
    it('should return a user and token for correct credentials', async () => {
      const body = {
        phone: '1234567890',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send(body)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should return a 403 for incorrect credentials', async () => {
      const body = {
        phone: '1234567890',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/user/login')
        .set('Content-Type', 'application/json')
        .send(body)
        .expect(403)
        .expect({
          message: 'Invalid Credentials',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('should return a 400 for empty body', async () => {
      const body = {};

      const response = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return a 400 for empty phone number', async () => {
      const body = {
        phone: '',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'phone should not be empty',
      ]);
    });

    it('should return a 400 for empty password', async () => {
      const body = {
        phone: '1234567890',
        password: '',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/user/login')
        .send(body)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'password should not be empty',
      ]);
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.ride.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });
});
