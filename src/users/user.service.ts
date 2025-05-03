import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { uploadToAzure } from 'src/libs/azure-upload';
import { BlobServiceClient } from '@azure/storage-blob';
const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!,
);
const container = blobService.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER || 'posts',
);

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeUserProfileById(id: string) {
    //Get User DB
    const user = await this.prisma.users.findUnique({
      where: { Id: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //Get Profile DB
    const profile = await this.prisma.profiles.findUnique({
      where: { UserId: id },
    });

    if (!profile) {
      throw new NotFoundException('User Profile not found');
    }

    //Get Friend Amount
    const friendCount = await this.prisma.friendships.count({
      where: {
        status: 'accepted',
        OR: [{ requester_id: id }, { addressee_id: id }],
      },
    });

    return {
      username: user.Username,
      profileImage: profile.ProfileImageUrl,
      friendsAmount: friendCount,
    };
  }

  async getProfileHeaderById(profileId: string, currentUserId: string) {
    //Get User DB
    const user = await this.prisma.users.findUnique({
      where: { Id: profileId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //Get Profile DB
    const profile = await this.prisma.profiles.findUnique({
      where: { UserId: profileId },
    });

    if (!profile) {
      throw new NotFoundException('User Profile not found');
    }

    //Get Friend ?
    const friendshipA = await this.prisma.friendships.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: currentUserId, addressee_id: profileId },
          { requester_id: profileId, addressee_id: currentUserId },
        ],
      },
    });

    const friendshipP = await this.prisma.friendships.findFirst({
      where: {
        status: 'pending',
        requester_id: currentUserId,
        addressee_id: profileId,
      },
    });

    const friendshipAP = await this.prisma.friendships.findFirst({
      where: {
        status: 'pending',
        requester_id: profileId,
        addressee_id: currentUserId,
      },
    });

    let relationship: string;
    if (profileId.toUpperCase() === currentUserId.toUpperCase()) {
      relationship = 'self';
    } else if (friendshipA) {
      relationship = 'friends';
    } else if (friendshipP) {
      relationship = 'pending';
    } else if (friendshipAP) {
      relationship = 'approving';
    } else {
      relationship = 'not_friends';
    }
    return {
      username: user.Username,
      profileImage: profile.ProfileImageUrl,
      backgroundImage: profile.BackgroundImageUrl,
      relation: relationship,
    };
  }

  async getProfileDetailsById(profileId: string) {
    //Get User DB
    const user = await this.prisma.users.findUnique({
      where: { Id: profileId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //Get Profile DB
    const profile = await this.prisma.profiles.findUnique({
      where: { UserId: profileId },
    });

    if (!profile) {
      throw new NotFoundException('User Profile not found');
    }

    const userInterests = await this.prisma.profileInterestTags.findMany({
      where: { UserId: profileId },
      include: {
        InterestTags: true,
      },
    });

    const interestNames = userInterests.map((item) => item.InterestTags.Name);

    if (!userInterests) {
      throw new NotFoundException('User Interests not found');
    }

    return {
      bio: profile.Bio,
      courseName: profile.CourseName,
      age: profile.Age,
      interests: interestNames,
    };
  }

  async updateUserProfile(updateProfileDto: UpdateUserDto) {
    const { userId, username, bio, age, courseName, interests } =
      updateProfileDto;

    //Get User DB
    const user = await this.prisma.users.findUnique({
      where: { Id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //Get Profile DB
    const profile = await this.prisma.profiles.findUnique({
      where: { UserId: userId },
    });

    if (!profile) {
      throw new NotFoundException('User Profile not found');
    }

    //Update User DB
    const updatedUser = await this.prisma.users.update({
      where: { Id: userId },
      data: {
        Username: username,
      },
    });

    //Update Profile DB
    const updatedProfile = await this.prisma.profiles.update({
      where: { UserId: userId },
      data: {
        Bio: bio,
        Age: age,
        CourseName: courseName,
      },
    });

    if (interests && interests.length > 0) {
      // Delete existing interests for the user
      await this.prisma.profileInterestTags.deleteMany({
        where: { UserId: userId },
      });

      // Insert new interests
      const interestTagIds = await this.prisma.interestTags.findMany({
        where: { Name: { in: interests } },
        select: { Id: true },
      });

      const newInterests = interestTagIds.map((tag) => ({
        UserId: userId,
        TagId: tag.Id,
      }));

      await this.prisma.profileInterestTags.createMany({
        data: newInterests,
      });
    } else {
      await this.prisma.profileInterestTags.deleteMany({
        where: { UserId: userId },
      });
    }

    if (!updatedUser || !updatedProfile) {
      throw new NotFoundException('Failed to update user or profile');
    }
    return true;
  }

  async getProfileImageById(id: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { UserId: id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile.ProfileImageUrl || null;
  }

  async getNotificationsById(id: string) {
    const notifications = await this.prisma.notifications.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        isRead: true,
        buttonURL: true,
        createdAt: true,
      },
    });

    if (!notifications) {
      throw new NotFoundException('Notifications not found');
    }

    return notifications;
  }

  async updateNotificationAsRead(id: string) {
    const notification = await this.prisma.notifications.update({
      where: { id },
      data: { isRead: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification.buttonURL;
  }

  async getAllTags(): Promise<string[]> {
    const tags = await this.prisma.interestTags.findMany({
      select: {
        Name: true,
      },
    });

    return tags.map((tag) => tag.Name);
  }

  async uploadProfile(file: Express.Multer.File, userId: string) {
    // Step 1: Find existing profile
    const userProfile = await this.prisma.profiles.findUnique({
      where: { UserId: userId },
    });

    // Step 2: Delete old profile image if exists
    if (userProfile?.ProfileImageUrl) {
      const oldBlobName = this.extractBlobName(userProfile.ProfileImageUrl);
      if (oldBlobName) {
        const oldBlob = container.getBlockBlobClient(oldBlobName);
        await oldBlob.deleteIfExists();
      }
    }

    // Step 3: Upload new profile image
    const newUrl = await uploadToAzure(file, 'profiles');

    // Step 4: Update DB
    await this.prisma.profiles.update({
      where: { UserId: userId },
      data: { ProfileImageUrl: newUrl },
    });

    return { message: 'Profile image updated', url: newUrl };
  }

  async uploadCover(file: Express.Multer.File, userId: string) {
    // Step 1: Find existing profile
    const userProfile = await this.prisma.profiles.findUnique({
      where: { UserId: userId },
    });

    // Step 2: Delete old cover image if exists
    if (userProfile?.BackgroundImageUrl) {
      const oldBlobName = this.extractBlobName(userProfile.BackgroundImageUrl);
      if (oldBlobName) {
        const oldBlob = container.getBlockBlobClient(oldBlobName);
        await oldBlob.deleteIfExists();
      }
    }

    // Step 3: Upload new cover image
    const newUrl = await uploadToAzure(file, 'covers');

    // Step 4: Update DB
    await this.prisma.profiles.update({
      where: { UserId: userId },
      data: { BackgroundImageUrl: newUrl },
    });

    return { message: 'Cover image updated', url: newUrl };
  }

  private extractBlobName(url: string): string | null {
    const split = url.split(`${container.containerName}/`);
    return split.length > 1 ? split[1] : null;
  }
}
