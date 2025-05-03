import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddFriendDto } from './dto/add-friend.dto';
import { AS } from './dto/friendship-requests.dto';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async addFriend(addFriendDto: AddFriendDto) {
    const { sender, addressee, status } = addFriendDto;

    const checking = await this.prisma.friendships.findFirst({
      where: {
        status: 'pending',
        OR: [
          { requester_id: sender, addressee_id: addressee },
          { requester_id: addressee, addressee_id: sender },
        ],
      },
    });

    if (checking != null) {
      return false;
    }

    const exists = await this.prisma.friendships.findFirst({
      where: {
        requester_id: sender,
        addressee_id: addressee,
      },
    });

    if (!exists) {
      await this.prisma.friendships.create({
        data: {
          requester_id: sender,
          addressee_id: addressee,
          status: status,
        },
      });
    } else {
      await this.prisma.friendships.updateMany({
        where: {
          requester_id: sender,
          addressee_id: addressee,
        },
        data: {
          status: status,
        },
      });
    }

    const senderUser = await this.prisma.users.findUnique({
      where: { Id: sender },
    });

    await this.prisma.notifications.create({
      data: {
        userId: addressee,
        message: ` ${senderUser!.Username} sent you a friend request`,
        buttonURL: `/profile/${sender}`,
      },
    });

    return true;
  }

  async approveFriendRequest(as: AS) {
    const { sender, addressee } = as;
    const approve = await this.prisma.friendships.updateMany({
      where: {
        requester_id: sender,
        addressee_id: addressee,
      },
      data: {
        status: 'accepted',
      },
    });

    if (!approve) {
      throw new NotFoundException('Failed to approve friend request');
    }
    const addresseeUser = await this.prisma.users.findUnique({
      where: { Id: addressee },
    });

    const senderUser = await this.prisma.users.findUnique({
      where: { Id: sender },
    });

    await this.prisma.notifications.create({
      data: {
        userId: sender,
        message: `You and ${addresseeUser!.Username} are now friends!`,
        buttonURL: `/profile/${addressee}`,
      },
    });

    await this.prisma.notifications.create({
      data: {
        userId: addressee,
        message: `You and ${senderUser!.Username} are now friends!`,
        buttonURL: `/profile/${sender}`,
      },
    });

    return true;
  }

  async rejectFriendRequest(as: AS) {
    const { sender, addressee } = as;
    const reject = await this.prisma.friendships.updateMany({
      where: {
        requester_id: sender,
        addressee_id: addressee,
      },
      data: {
        status: 'rejected',
      },
    });
    if (!reject) {
      throw new NotFoundException('Failed to reject friend request');
    }

    const addresseeUser = await this.prisma.users.findUnique({
      where: { Id: addressee },
    });

    await this.prisma.notifications.create({
      data: {
        userId: sender,
        message: `Your friend request to ${addresseeUser!.Username} was rejected!`,
        buttonURL: `/profile/${sender}`,
      },
    });

    return true;
  }

  async getFriendListById(id: string) {
    const friendships = await this.prisma.friendships.findMany({
      where: {
        status: 'accepted',
        OR: [{ requester_id: id }, { addressee_id: id }],
      },
      select: {
        requester_id: true,
        addressee_id: true,
        Users_Friendships_requester_idToUsers: {
          select: {
            Id: true,
            Username: true,
            Profiles: {
              select: {
                ProfileImageUrl: true,
              },
            },
          },
        },
        Users_Friendships_addressee_idToUsers: {
          select: {
            Id: true,
            Username: true,
            Profiles: {
              select: {
                ProfileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!friendships) {
      throw new NotFoundException('Friend list not found');
    }

    const friendList = friendships.map((friendship) => {
      const isRequester = friendship.requester_id === id;
      const friend = isRequester
        ? friendship.Users_Friendships_addressee_idToUsers
        : friendship.Users_Friendships_requester_idToUsers;

      return {
        id: friend.Id,
        username: friend.Username,
        profileImageUrl: friend.Profiles?.ProfileImageUrl || null,
      };
    });

    return friendList;
  }

  async getFriendRequestById(id: string) {
    const friendships = await this.prisma.friendships.findMany({
      where: {
        status: 'pending',
        addressee_id: id,
      },
      select: {
        requester_id: true,
        Users_Friendships_requester_idToUsers: {
          select: {
            Id: true,
            Username: true,
            Profiles: {
              select: {
                ProfileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!friendships) {
      throw new NotFoundException('Friend request not found');
    }

    const friendRequestList = friendships.map((friendship) => {
      const requester = friendship.Users_Friendships_requester_idToUsers;

      return {
        id: requester.Id,
        username: requester.Username,
        profileImageUrl: requester.Profiles?.ProfileImageUrl || null,
      };
    });

    return friendRequestList;
  }

  async unfriend(as: AS) {
    const { sender, addressee } = as;

    const friendship = await this.prisma.friendships.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: sender, addressee_id: addressee },
          { requester_id: addressee, addressee_id: sender },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendships.delete({
      where: { id: friendship.id },
    });

    const senderUser = await this.prisma.users.findUnique({
      where: { Id: sender },
    });

    await this.prisma.notifications.create({
      data: {
        userId: addressee,
        message: `${senderUser!.Username} removed you from friends.`,
        buttonURL: `/profile/${sender}`,
      },
    });

    return true;
  }
}
