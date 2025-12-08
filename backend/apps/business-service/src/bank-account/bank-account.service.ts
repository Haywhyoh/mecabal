import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '@app/database/entities/bank-account.entity';
import { PaystackService } from '../payment/paystack/paystack.service';
import { CreateBankAccountDto, VerifyBankAccountDto } from '../dto/bank-account.dto';

// Nigerian banks list
const NIGERIAN_BANKS: Record<string, string> = {
  '044': 'Access Bank',
  '050': 'Ecobank Nigeria',
  '070': 'Fidelity Bank',
  '011': 'First Bank of Nigeria',
  '214': 'First City Monument Bank',
  '058': 'Guaranty Trust Bank',
  '030': 'Heritage Bank',
  '301': 'Jaiz Bank',
  '082': 'Keystone Bank',
  '526': 'Parallex Bank',
  '076': 'Polaris Bank',
  '101': 'Providus Bank',
  '221': 'Stanbic IBTC Bank',
  '068': 'Standard Chartered Bank',
  '232': 'Sterling Bank',
  '100': 'Suntrust Bank',
  '032': 'Union Bank of Nigeria',
  '033': 'United Bank For Africa',
  '215': 'Unity Bank',
  '035': 'Wema Bank',
  '057': 'Zenith Bank',
};

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepo: Repository<BankAccount>,
    private paystackService: PaystackService,
  ) {}

  async create(
    userId: string,
    createDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    // Get bank name
    const bankName = NIGERIAN_BANKS[createDto.bankCode] || 'Unknown Bank';

    // Resolve account name using Paystack
    let accountName = createDto.accountName;
    try {
      const resolved = await this.paystackService.resolveBankAccount(
        createDto.accountNumber,
        createDto.bankCode,
      );
      if (resolved.status && resolved.data) {
        accountName = resolved.data.account_name;
      }
    } catch (error) {
      // If resolution fails, use provided name or account number
      if (!accountName) {
        accountName = createDto.accountNumber;
      }
    }

    // Check if account already exists
    const existing = await this.bankAccountRepo.findOne({
      where: {
        userId,
        accountNumber: createDto.accountNumber,
        bankCode: createDto.bankCode,
      },
    });

    if (existing) {
      throw new BadRequestException('Bank account already exists');
    }

    // Create bank account
    const bankAccount = this.bankAccountRepo.create({
      userId,
      accountNumber: createDto.accountNumber,
      bankCode: createDto.bankCode,
      bankName,
      accountName,
      isVerified: !!accountName && accountName !== createDto.accountNumber,
      isDefault: false, // Will be set if this is the first account
    });

    // If this is the first account, set as default
    const existingAccounts = await this.bankAccountRepo.count({
      where: { userId },
    });

    if (existingAccounts === 0) {
      bankAccount.isDefault = true;
    }

    return await this.bankAccountRepo.save(bankAccount);
  }

  async findAll(userId: string): Promise<BankAccount[]> {
    return await this.bankAccountRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findById(accountId: string): Promise<BankAccount> {
    const account = await this.bankAccountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return account;
  }

  async verify(
    accountId: string,
    userId: string,
    verifyDto: VerifyBankAccountDto,
  ): Promise<BankAccount> {
    const account = await this.findById(accountId);

    if (account.userId !== userId) {
      throw new ForbiddenException('You do not have permission to verify this account');
    }

    // Verify with Paystack
    try {
      const resolved = await this.paystackService.resolveBankAccount(
        verifyDto.accountNumber,
        verifyDto.bankCode,
      );

      if (resolved.status && resolved.data) {
        account.accountName = resolved.data.account_name;
        account.isVerified = true;
      } else {
        throw new BadRequestException('Account verification failed');
      }
    } catch (error) {
      throw new BadRequestException('Failed to verify bank account');
    }

    return await this.bankAccountRepo.save(account);
  }

  async remove(accountId: string, userId: string): Promise<void> {
    const account = await this.findById(accountId);

    if (account.userId !== userId) {
      throw new ForbiddenException('You do not have permission to remove this account');
    }

    // If this is the default account, set another account as default
    if (account.isDefault) {
      const otherAccounts = await this.bankAccountRepo.find({
        where: { userId },
      });
      const otherAccount = otherAccounts.find(acc => acc.id !== accountId);

      if (otherAccount) {
        otherAccount.isDefault = true;
        await this.bankAccountRepo.save(otherAccount);
      }
    }

    await this.bankAccountRepo.remove(account);
  }

  async setDefault(accountId: string, userId: string): Promise<BankAccount> {
    const account = await this.findById(accountId);

    if (account.userId !== userId) {
      throw new ForbiddenException('You do not have permission to set this account as default');
    }

    // Remove default from all other accounts
    await this.bankAccountRepo.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Set this account as default
    account.isDefault = true;
    return await this.bankAccountRepo.save(account);
  }
}





