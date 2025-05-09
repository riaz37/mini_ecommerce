import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;
    
    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Check if customer with this email already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    // Create customer record if it doesn't exist
    if (!existingCustomer) {
      await this.prisma.customer.create({
        data: {
          email,
          name,
        },
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
