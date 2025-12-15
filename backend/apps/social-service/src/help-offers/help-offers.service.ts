import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HelpOffer,
  HelpOfferStatus,
  Post,
  User,
} from '@app/database';
import {
  CreateHelpOfferDto,
  HelpOfferResponseDto,
  UpdateHelpOfferStatusDto,
  HelpOfferFilterDto,
  UserInfoDto,
  PostInfoDto,
} from './dto';

@Injectable()
export class HelpOffersService {
  constructor(
    @InjectRepository(HelpOffer)
    private readonly helpOfferRepository: Repository<HelpOffer>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createHelpOffer(
    postId: string,
    userId: string,
    createHelpOfferDto: CreateHelpOfferDto,
  ): Promise<HelpOfferResponseDto> {
    // Validate post exists and is a help request
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.postType !== 'help') {
      throw new BadRequestException('Can only offer help on help request posts');
    }

    // Check if user is trying to offer help on their own post
    if (post.userId === userId) {
      throw new BadRequestException('Cannot offer help on your own post');
    }

    // Check for duplicate offer
    const existingOffer = await this.helpOfferRepository.findOne({
      where: { postId, userId },
    });

    if (existingOffer) {
      if (existingOffer.status === HelpOfferStatus.CANCELLED) {
        // Allow recreating if previously cancelled
        await this.helpOfferRepository.remove(existingOffer);
      } else {
        throw new BadRequestException('You have already offered help for this post');
      }
    }

    // Create help offer
    const helpOffer = this.helpOfferRepository.create({
      postId,
      userId,
      message: createHelpOfferDto.message,
      contactMethod: createHelpOfferDto.contactMethod,
      availability: createHelpOfferDto.availability,
      estimatedTime: createHelpOfferDto.estimatedTime,
      status: HelpOfferStatus.PENDING,
    });

    const savedOffer = await this.helpOfferRepository.save(helpOffer);

    // Fetch with relations for response
    const offerWithRelations = await this.helpOfferRepository.findOne({
      where: { id: savedOffer.id },
      relations: ['user', 'post'],
    });

    if (!offerWithRelations) {
      throw new NotFoundException('Help offer not found after creation');
    }

    return this.mapToResponseDto(offerWithRelations);
  }

  async getHelpOffersByPost(
    postId: string,
    requesterUserId?: string,
  ): Promise<HelpOfferResponseDto[]> {
    // Validate post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If requesterUserId is provided, verify they own the post
    if (requesterUserId && post.userId !== requesterUserId) {
      throw new ForbiddenException('Only the post owner can view help offers');
    }

    const offers = await this.helpOfferRepository.find({
      where: { postId },
      relations: ['user', 'post'],
      order: { createdAt: 'DESC' },
    });

    return offers.map((offer) => this.mapToResponseDto(offer));
  }

  async getHelpOffersByUser(userId: string): Promise<HelpOfferResponseDto[]> {
    const offers = await this.helpOfferRepository.find({
      where: { userId },
      relations: ['user', 'post'],
      order: { createdAt: 'DESC' },
    });

    return offers.map((offer) => this.mapToResponseDto(offer));
  }

  async getHelpOfferById(offerId: string): Promise<HelpOfferResponseDto> {
    const offer = await this.helpOfferRepository.findOne({
      where: { id: offerId },
      relations: ['user', 'post'],
    });

    if (!offer) {
      throw new NotFoundException('Help offer not found');
    }

    return this.mapToResponseDto(offer);
  }

  async acceptHelpOffer(
    offerId: string,
    requesterUserId: string,
  ): Promise<HelpOfferResponseDto> {
    const offer = await this.helpOfferRepository.findOne({
      where: { id: offerId },
      relations: ['post', 'user'],
    });

    if (!offer) {
      throw new NotFoundException('Help offer not found');
    }

    // Verify requester owns the post
    if (offer.post.userId !== requesterUserId) {
      throw new ForbiddenException('Only the post owner can accept help offers');
    }

    // Check if offer is in a valid state
    if (offer.status !== HelpOfferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept offer with status: ${offer.status}`,
      );
    }

    // Update offer status
    offer.status = HelpOfferStatus.ACCEPTED;
    offer.acceptedAt = new Date();
    const updatedOffer = await this.helpOfferRepository.save(offer);

    // Optionally reject other pending offers for the same post
    // This is optional - you might want to allow multiple accepted offers
    // await this.helpOfferRepository.update(
    //   {
    //     postId: offer.postId,
    //     status: HelpOfferStatus.PENDING,
    //     id: Not(offerId),
    //   },
    //   { status: HelpOfferStatus.REJECTED },
    // );

    return this.mapToResponseDto(updatedOffer);
  }

  async rejectHelpOffer(
    offerId: string,
    requesterUserId: string,
  ): Promise<HelpOfferResponseDto> {
    const offer = await this.helpOfferRepository.findOne({
      where: { id: offerId },
      relations: ['post'],
    });

    if (!offer) {
      throw new NotFoundException('Help offer not found');
    }

    // Verify requester owns the post
    if (offer.post.userId !== requesterUserId) {
      throw new ForbiddenException('Only the post owner can reject help offers');
    }

    // Check if offer is in a valid state
    if (offer.status !== HelpOfferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject offer with status: ${offer.status}`,
      );
    }

    // Update offer status
    offer.status = HelpOfferStatus.REJECTED;
    const updatedOffer = await this.helpOfferRepository.save(offer);

    return this.mapToResponseDto(updatedOffer);
  }

  async cancelHelpOffer(
    offerId: string,
    userId: string,
  ): Promise<HelpOfferResponseDto> {
    const offer = await this.helpOfferRepository.findOne({
      where: { id: offerId },
      relations: ['user'],
    });

    if (!offer) {
      throw new NotFoundException('Help offer not found');
    }

    // Verify user owns the offer
    if (offer.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own help offers');
    }

    // Check if offer can be cancelled
    if (
      offer.status === HelpOfferStatus.ACCEPTED ||
      offer.status === HelpOfferStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cannot cancel an accepted or completed offer',
      );
    }

    // Update offer status
    offer.status = HelpOfferStatus.CANCELLED;
    const updatedOffer = await this.helpOfferRepository.save(offer);

    return this.mapToResponseDto(updatedOffer);
  }

  private mapToResponseDto(offer: HelpOffer): HelpOfferResponseDto {
    const userInfo: UserInfoDto | undefined = offer.user
      ? {
          id: offer.user.id,
          firstName: offer.user.firstName,
          lastName: offer.user.lastName,
          profilePictureUrl: offer.user.profilePictureUrl || undefined,
          isVerified: offer.user.isVerified || false,
          trustScore: offer.user.trustScore || 0,
        }
      : undefined;

    const postInfo: PostInfoDto | undefined = offer.post
      ? {
          id: offer.post.id,
          content: offer.post.content,
          postType: offer.post.postType,
          helpCategory: offer.post.helpCategory || undefined,
        }
      : undefined;

    return {
      id: offer.id,
      postId: offer.postId,
      userId: offer.userId,
      message: offer.message,
      contactMethod: offer.contactMethod,
      availability: offer.availability,
      estimatedTime: offer.estimatedTime,
      status: offer.status,
      acceptedAt: offer.acceptedAt,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      user: userInfo,
      post: postInfo,
    };
  }
}

