import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserNS } from 'src/users/schemas/user.schema';
import { InMemHybridCache } from './in-mem-hybrid-cache';

@Injectable()
export class CampusAdminCacheService {
  // Add max entries for the cache
  private readonly campusAdminsCacheMaxEntries = 100; // max 100 (admins for 100 campuses)

  // Add TTLs for the cache (sliding and absolute)
  private readonly campusAdminsCacheSlidingTTL = 10 * 60 * 1000; // 10 minutes
  private readonly campusAdminsCacheAbsoluteTTL = 4 * 60 * 60 * 1000; // 4 hours

  /**
   * In-memory cache for campus admin user IDs, using InMemHybridCache.
   * - Max 100 campuses
   * - Sliding expiration: 10 minutes
   * - Absolute max staleness: 4 hours
   */
  private campusAdminsCache = new InMemHybridCache<string, string[]>(
    this.campusAdminsCacheMaxEntries,
    this.campusAdminsCacheSlidingTTL,
    this.campusAdminsCacheAbsoluteTTL,
  );

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Retrieves the user IDs of campus admins for a given campus, using an in-memory cache for efficiency.
   * @param campusId - The ObjectId of the campus whose admin user IDs are to be retrieved.
   * @param useCache - Whether to use the cache (default: true).
   * @returns Promise<string[]> - Array of campus admin user IDs as strings.
   */
  async getCampusAdminIdsForCampus(
    campusId: Types.ObjectId,
    useCache: boolean = true,
  ): Promise<string[]> {
    const campusIdString = campusId.toString();
    if (useCache) {
      const cached = this.campusAdminsCache.get(campusIdString);
      if (cached) return cached;
    }
    // Fetch from DB
    const campusAdmins = await this.userModel
      .find({ campus_id: campusId, user_type: UserNS.UserType.Campus_Admin })
      .select('_id');
    const campusAdminIds = campusAdmins.map((a) => a._id.toString());
    if (useCache) {
      this.campusAdminsCache.set(campusIdString, campusAdminIds);
    }
    return campusAdminIds;
  }

  /**
   * Invalidate the campus admin cache for a campus (call this when admins are added/removed)
   */
  public invalidateCampusAdminsCache(campusId: string) {
    this.campusAdminsCache.delete(campusId);
  }
}
