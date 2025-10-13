import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Listing,
  User,
  ListingCategory,
} from '@app/database';

export interface JobSearchDto {
  query?: string;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'freelance';
  workLocation?: 'remote' | 'on_site' | 'hybrid';
  minSalary?: number;
  maxSalary?: number;
  requiredSkills?: string[];
  applicationDeadlineBefore?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'salary' | 'relevance' | 'deadline';
  sortOrder?: 'ASC' | 'DESC';
}

export interface JobApplicationDto {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: number;
  availabilityDate?: string;
  additionalInfo?: string;
}

export interface JobMatchDto {
  userId: string;
  jobId: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export interface PaginatedJobResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
  ) {}

  async searchJobs(
    searchDto: JobSearchDto,
    userId?: string,
  ): Promise<PaginatedJobResponse> {
    const queryBuilder = this.createJobQueryBuilder();

    // Apply search filters
    this.applyJobFilters(queryBuilder, searchDto);

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    this.applyJobSorting(queryBuilder, searchDto);

    // Execute query
    const [jobs, total] = await queryBuilder.getManyAndCount();

    // Format response
    const formattedJobs = await Promise.all(
      jobs.map((job) => this.formatJobResponse(job, userId)),
    );

    return {
      data: formattedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async getJobById(id: string, userId?: string): Promise<any> {
    const job = await this.listingRepository.findOne({
      where: { id, listingType: 'job' },
      relations: ['user', 'category', 'media'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.formatJobResponse(job, userId);
  }

  async createJobApplication(
    userId: string,
    applicationDto: JobApplicationDto,
  ): Promise<any> {
    // Verify job exists and is active
    const job = await this.listingRepository.findOne({
      where: { id: applicationDto.jobId, listingType: 'job', status: 'active' },
    });

    if (!job) {
      throw new NotFoundException('Job not found or not available');
    }

    // Check if user already applied
    const existingApplication = await this.listingRepository.query(
      `SELECT * FROM job_applications WHERE job_id = $1 AND user_id = $2`,
      [applicationDto.jobId, userId],
    );

    if (existingApplication.length > 0) {
      throw new BadRequestException('You have already applied for this job');
    }

    // Check application deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new BadRequestException('Application deadline has passed');
    }

    // Create job application
    const application = await this.listingRepository.query(
      `INSERT INTO job_applications (
        job_id, user_id, cover_letter, resume_url, portfolio_url, 
        expected_salary, availability_date, additional_info, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        applicationDto.jobId,
        userId,
        applicationDto.coverLetter || null,
        applicationDto.resumeUrl || null,
        applicationDto.portfolioUrl || null,
        applicationDto.expectedSalary || null,
        applicationDto.availabilityDate || null,
        applicationDto.additionalInfo || null,
        'pending',
        new Date(),
      ],
    );

    return this.formatJobApplicationResponse(application[0]);
  }

  async getJobApplications(
    jobId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobResponse> {
    // Verify job ownership
    const job = await this.listingRepository.findOne({
      where: { id: jobId, userId, listingType: 'job' },
    });

    if (!job) {
      throw new ForbiddenException('You can only view applications for your own jobs');
    }

    const skip = (page - 1) * limit;

    const applications = await this.listingRepository.query(
      `SELECT ja.*, u.first_name, u.last_name, u.profile_picture_url, u.is_verified
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       WHERE ja.job_id = $1
       ORDER BY ja.created_at DESC
       LIMIT $2 OFFSET $3`,
      [jobId, limit, skip],
    );

    const total = await this.listingRepository.query(
      `SELECT COUNT(*) as count FROM job_applications WHERE job_id = $1`,
      [jobId],
    );

    const formattedApplications = applications.map((app: any) =>
      this.formatJobApplicationResponse(app),
    );

    return {
      data: formattedApplications,
      total: parseInt(total[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total[0].count) / limit),
      hasMore: page < Math.ceil(parseInt(total[0].count) / limit),
    };
  }

  async getUserApplications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobResponse> {
    const skip = (page - 1) * limit;

    const applications = await this.listingRepository.query(
      `SELECT ja.*, l.title as job_title, l.description as job_description,
              l.employment_type, l.salary_min, l.salary_max, l.work_location,
              l.application_deadline, l.company_info
       FROM job_applications ja
       JOIN listings l ON ja.job_id = l.id
       WHERE ja.user_id = $1
       ORDER BY ja.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, skip],
    );

    const total = await this.listingRepository.query(
      `SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1`,
      [userId],
    );

    const formattedApplications = applications.map((app: any) =>
      this.formatJobApplicationResponse(app),
    );

    return {
      data: formattedApplications,
      total: parseInt(total[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total[0].count) / limit),
      hasMore: page < Math.ceil(parseInt(total[0].count) / limit),
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    jobId: string,
    userId: string,
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired',
    notes?: string,
  ): Promise<any> {
    // Verify job ownership
    const job = await this.listingRepository.findOne({
      where: { id: jobId, userId, listingType: 'job' },
    });

    if (!job) {
      throw new ForbiddenException('You can only update applications for your own jobs');
    }

    // Update application status
    const application = await this.listingRepository.query(
      `UPDATE job_applications 
       SET status = $1, notes = $2, updated_at = $3
       WHERE id = $4 AND job_id = $5
       RETURNING *`,
      [status, notes || null, new Date(), applicationId, jobId],
    );

    if (application.length === 0) {
      throw new NotFoundException('Application not found');
    }

    return this.formatJobApplicationResponse(application[0]);
  }

  async getJobMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobResponse> {
    // Get user profile and skills
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    // Find jobs that match user's skills and preferences
    const matches = await this.listingRepository.query(
      `SELECT l.*, 
              CASE 
                WHEN l.required_skills IS NOT NULL THEN
                  (SELECT COUNT(*) FROM unnest(l.required_skills) AS skill 
                   WHERE skill = ANY($1::text[]))
                ELSE 0
              END as matching_skills_count,
              l.required_skills
       FROM listings l
       WHERE l.listing_type = 'job' 
         AND l.status = 'active'
         AND (l.application_deadline IS NULL OR l.application_deadline > NOW())
       ORDER BY matching_skills_count DESC, l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.professionalSkills ? user.professionalSkills.split(',').map(s => s.trim()) : [], limit, skip],
    );

    const total = await this.listingRepository.query(
      `SELECT COUNT(*) as count 
       FROM listings 
       WHERE listing_type = 'job' 
         AND status = 'active'
         AND (application_deadline IS NULL OR application_deadline > NOW())`,
    );

    const formattedMatches = await Promise.all(
      matches.map((job: any) => this.formatJobMatchResponse(job, user)),
    );

    return {
      data: formattedMatches,
      total: parseInt(total[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total[0].count) / limit),
      hasMore: page < Math.ceil(parseInt(total[0].count) / limit),
    };
  }

  async getJobAnalytics(
    jobId: string,
    userId: string,
  ): Promise<any> {
    // Verify job ownership
    const job = await this.listingRepository.findOne({
      where: { id: jobId, userId, listingType: 'job' },
    });

    if (!job) {
      throw new ForbiddenException('You can only view analytics for your own jobs');
    }

    const analytics = await this.listingRepository.query(
      `SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_applications,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted_applications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
        COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired_applications,
        AVG(expected_salary) as average_expected_salary,
        MIN(created_at) as first_application,
        MAX(created_at) as last_application
       FROM job_applications 
       WHERE job_id = $1`,
      [jobId],
    );

    return {
      jobId,
      totalApplications: parseInt(analytics[0].total_applications),
      pendingApplications: parseInt(analytics[0].pending_applications),
      reviewedApplications: parseInt(analytics[0].reviewed_applications),
      shortlistedApplications: parseInt(analytics[0].shortlisted_applications),
      rejectedApplications: parseInt(analytics[0].rejected_applications),
      hiredApplications: parseInt(analytics[0].hired_applications),
      averageExpectedSalary: parseFloat(analytics[0].average_expected_salary) || 0,
      firstApplication: analytics[0].first_application,
      lastApplication: analytics[0].last_application,
      viewsCount: job.viewsCount,
      savesCount: job.savesCount,
    };
  }

  private createJobQueryBuilder(): SelectQueryBuilder<Listing> {
    return this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoinAndSelect('listing.media', 'media')
      .where('listing.listingType = :listingType', { listingType: 'job' });
  }

  private applyJobFilters(
    queryBuilder: SelectQueryBuilder<Listing>,
    searchDto: JobSearchDto,
  ): void {
    // Text search
    if (searchDto.query) {
      queryBuilder.andWhere(
        `(
          listing.title ILIKE :query OR 
          listing.description ILIKE :query OR
          listing.company_info->>'name' ILIKE :query
        )`,
        { query: `%${searchDto.query}%` },
      );
    }

    // Employment type filter
    if (searchDto.employmentType) {
      queryBuilder.andWhere('listing.employmentType = :employmentType', {
        employmentType: searchDto.employmentType,
      });
    }

    // Work location filter
    if (searchDto.workLocation) {
      queryBuilder.andWhere('listing.workLocation = :workLocation', {
        workLocation: searchDto.workLocation,
      });
    }

    // Salary range filters
    if (searchDto.minSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMin >= :minSalary', {
        minSalary: searchDto.minSalary,
      });
    }

    if (searchDto.maxSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMax <= :maxSalary', {
        maxSalary: searchDto.maxSalary,
      });
    }

    // Required skills filter
    if (searchDto.requiredSkills && searchDto.requiredSkills.length > 0) {
      queryBuilder.andWhere(
        'listing.requiredSkills && :requiredSkills',
        { requiredSkills: searchDto.requiredSkills },
      );
    }

    // Application deadline filter
    if (searchDto.applicationDeadlineBefore) {
      queryBuilder.andWhere('listing.applicationDeadline <= :deadline', {
        deadline: new Date(searchDto.applicationDeadlineBefore),
      });
    }

    // Location-based search
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      const radiusMeters = searchDto.radius * 1000;
      queryBuilder.andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(listing.longitude, listing.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude: searchDto.latitude,
          longitude: searchDto.longitude,
          radius: radiusMeters,
        },
      );
    }

    // Only show active jobs
    queryBuilder.andWhere('listing.status = :status', { status: 'active' });
  }

  private applyJobSorting(
    queryBuilder: SelectQueryBuilder<Listing>,
    searchDto: JobSearchDto,
  ): void {
    const sortBy = searchDto.sortBy || 'createdAt';
    const sortOrder = searchDto.sortOrder || 'DESC';

    switch (sortBy) {
      case 'salary':
        queryBuilder.orderBy('listing.salaryMin', sortOrder);
        break;
      case 'deadline':
        queryBuilder.orderBy('listing.applicationDeadline', 'ASC');
        break;
      case 'relevance':
        // For relevance, we'll use a combination of views and saves
        queryBuilder.orderBy('listing.viewsCount', 'DESC');
        queryBuilder.addOrderBy('listing.savesCount', 'DESC');
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('listing.createdAt', sortOrder);
        break;
    }
  }

  private async formatJobResponse(job: Listing, userId?: string): Promise<any> {
    return {
      id: job.id,
      userId: job.userId,
      category: {
        id: job.category.id,
        listingType: job.category.listingType,
        name: job.category.name,
        description: job.category.description,
        iconUrl: job.category.iconUrl,
        colorCode: job.category.colorCode,
      },
      title: job.title,
      description: job.description,
      price: Number(job.price),
      currency: job.currency,
      priceType: job.priceType,
      // Job-specific fields
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      applicationDeadline: job.applicationDeadline,
      requiredSkills: job.requiredSkills,
      workLocation: job.workLocation,
      companyInfo: job.companyInfo,
      location: {
        latitude: job.latitude,
        longitude: job.longitude,
        address: job.address,
      },
      media: job.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        caption: m.caption,
        displayOrder: m.displayOrder,
        createdAt: m.createdAt,
      })),
      status: job.status,
      viewsCount: job.viewsCount,
      savesCount: job.savesCount,
      author: {
        id: job.user.id,
        firstName: job.user.firstName,
        lastName: job.user.lastName,
        profilePicture: job.user.profilePictureUrl,
        isVerified: job.user.isVerified,
        createdAt: job.user.createdAt,
      },
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      updatedAt: job.updatedAt,
    };
  }

  private formatJobApplicationResponse(application: any): any {
    return {
      id: application.id,
      jobId: application.job_id,
      userId: application.user_id,
      coverLetter: application.cover_letter,
      resumeUrl: application.resume_url,
      portfolioUrl: application.portfolio_url,
      expectedSalary: application.expected_salary,
      availabilityDate: application.availability_date,
      additionalInfo: application.additional_info,
      status: application.status,
      notes: application.notes,
      user: {
        id: application.user_id,
        firstName: application.first_name,
        lastName: application.last_name,
        profilePicture: application.profile_picture_url,
        isVerified: application.is_verified,
      },
      job: application.job_title ? {
        title: application.job_title,
        description: application.job_description,
        employmentType: application.employment_type,
        salaryMin: application.salary_min,
        salaryMax: application.salary_max,
        workLocation: application.work_location,
        applicationDeadline: application.application_deadline,
        companyInfo: application.company_info,
      } : null,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
    };
  }

  private async formatJobMatchResponse(job: Listing, user: User): Promise<any> {
    const userSkills = user.professionalSkills ? user.professionalSkills.split(',').map(s => s.trim()) : [];
    const requiredSkills = job.requiredSkills || [];
    const matchingSkills = userSkills.filter((skill: string) => requiredSkills.includes(skill));
    const missingSkills = requiredSkills.filter((skill: string) => !userSkills.includes(skill));
    
    const matchScore = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * 100 
      : 0;

    const reasons = [];
    if (matchingSkills.length > 0) {
      reasons.push(`You have ${matchingSkills.length} matching skills: ${matchingSkills.join(', ')}`);
    }
    if (missingSkills.length > 0) {
      reasons.push(`Missing skills: ${missingSkills.join(', ')}`);
    }
    if (job.workLocation === 'remote') {
      reasons.push('Remote work available');
    }

    return {
      ...(await this.formatJobResponse(job)),
      matchScore: Math.round(matchScore),
      matchingSkills,
      missingSkills,
      reasons,
    };
  }
}
