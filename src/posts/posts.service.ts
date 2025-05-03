import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { uploadToAzure } from 'src/libs/azure-upload';
import { ForbiddenException } from '@nestjs/common';
enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    userId: string,
    content: string | undefined,
    files: Express.Multer.File[],
    interestTagIds: string[],
  ) {
    if (!content && files.length === 0) {
      throw new BadRequestException('Post must have text or media.');
    }

    if (!interestTagIds || interestTagIds.length === 0) {
      throw new BadRequestException('At least one tag must be selected.');
    }

    const mediaData = await Promise.all(
      files.map(async (file) => ({
        Url: await uploadToAzure(file),
        Type: file.mimetype.startsWith('video')
          ? MediaType.VIDEO
          : MediaType.IMAGE,
      })),
    );

    const post = await this.prisma.posts.create({
      data: {
        Content: content! || '',
        UserId: userId,
        PostMedia: { createMany: { data: mediaData } },
        PostTags: {
          create: interestTagIds.map((tagId) => ({
            InterestTagId: tagId,
          })),
        },
      },
      include: { PostMedia: true },
    });

    return post;
  }

  async getAllTags(): Promise<{ id: string; name: string }[]> {
    const tags = await this.prisma.interestTags.findMany({
      select: {
        Id: true,
        Name: true,
      },
    });

    return tags.map((tag) => ({
      id: tag.Id,
      name: tag.Name,
    }));
  }

  async getPostsByUser(userId: string) {
    return this.prisma.posts.findMany({
      where: { UserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        Users: {
          select: {
            Username: true,
            Profiles: {
              select: {
                ProfileImageUrl: true,
              },
            },
          },
        },
        PostMedia: {
          select: {
            Url: true,
            Type: true,
          },
        },
        Likes: {
          select: { Id: true }, // just count length on frontend
        },
        Comments: {
          select: { Id: true }, // same, just count on frontend
        },
        PostTags: {
          select: {
            InterestTags: {
              select: {
                Id: true,
                Name: true,
              },
            },
          },
        },
      },
    });
  }

  async updatePost(
    postId: string,
    userId: string,
    content: string,
    interestTagIds: string[],
  ) {
    const existing = await this.prisma.posts.findUnique({
      where: { Id: postId },
      select: { UserId: true },
    });

    if (!existing || existing.UserId !== userId) {
      throw new ForbiddenException('Not authorized to edit this post.');
    }

    await this.prisma.postTags.deleteMany({ where: { PostId: postId } });

    return this.prisma.posts.update({
      where: { Id: postId },
      data: {
        Content: content,
        PostTags: {
          create: interestTagIds.map((tagId) => ({
            InterestTagId: tagId,
          })),
        },
      },
      include: {
        PostTags: {
          include: { InterestTags: true },
        },
      },
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.posts.findUnique({
      where: { Id: postId },
    });

    if (!post || post.UserId !== userId) {
      throw new ForbiddenException('Not authorized to delete this post.');
    }

    return this.prisma.posts.delete({
      where: { Id: postId },
    });
  }

  async getMainFeed(userId: string, cursor?: string, limit = 10) {
    // Step 1: Get user friends
    const friends = await this.prisma.friendships.findMany({
      where: {
        OR: [
          { requester_id: userId, status: 'accepted' },
          { addressee_id: userId, status: 'accepted' },
        ],
      },
      select: {
        requester_id: true,
        addressee_id: true,
      },
    });

    const friendIds = friends.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id,
    );

    // Step 2: Get user interest tags
    const myInterestTags = await this.prisma.profileInterestTags.findMany({
      where: { UserId: userId },
      select: { TagId: true },
    });

    // Add friend ids to interests.map((i) => i.interestTagId);
    const interestTagIds = myInterestTags.map((i) => i.TagId);

    // Step 3: Query posts
    const posts = await this.prisma.posts.findMany({
      where: {
        UserId: { not: userId },
        OR: [
          {
            AND: [
              { UserId: { in: friendIds } },
              { PostTags: { some: { InterestTagId: { in: interestTagIds } } } },
            ],
          },
          { UserId: { in: friendIds } },
          { PostTags: { some: { InterestTagId: { in: interestTagIds } } } },
        ],
      },
      include: {
        Users: {
          select: {
            Username: true,
            Profiles: { select: { ProfileImageUrl: true } },
          },
        },
        PostMedia: true,
        PostTags: {
          select: {
            InterestTags: {
              select: { Id: true, Name: true },
            },
          },
        },
        Likes: true,
        Comments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { Id: cursor } }),
    });

    // Step 4: Compute priority
    const prioritized = posts.map((post) => {
      const isFriend = friendIds.includes(post.UserId);
      const hasCommonInterest = post.PostTags.some((tag) =>
        interestTagIds.includes(tag.InterestTags.Id),
      );

      let priority = 0;
      if (isFriend && hasCommonInterest) {
        priority = 3;
      } else if (isFriend) {
        priority = 2;
      } else if (hasCommonInterest) {
        priority = 1;
      }

      return {
        ...post,
        priority,
      };
    });

    prioritized.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });

    // Step 5: Cursor Pagination Handling
    let nextCursor: string | null = null;
    if (prioritized.length > limit) {
      const nextPost = prioritized.pop();
      nextCursor = nextPost?.Id || null;
    }

    return {
      posts: prioritized.map((post) => ({
        postId: post.Id,
        userId: post.UserId,
        username: post.Users.Username,
        userAvatar: post.Users.Profiles?.ProfileImageUrl || null,
        createdAt: post.createdAt,
        content: post.Content,
        media: post.PostMedia.map((m) => ({ url: m.Url, type: m.Type })),
        likeCount: post.Likes.length,
        commentCount: post.Comments.length,
        tags: post.PostTags.map((t) => ({
          id: t.InterestTags.Id,
          name: t.InterestTags.Name,
        })),
      })),
      nextCursor,
    };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.posts.findUnique({
      where: { Id: postId },
      include: {
        Users: {
          select: {
            Username: true,
            Profiles: {
              select: {
                ProfileImageUrl: true,
              },
            },
          },
        },
        PostMedia: {
          select: {
            Url: true,
            Type: true,
          },
        },
        Likes: {
          select: {
            Id: true,
            UserId: true,
            PostId: true,
          },
        },
        Comments: {
          select: {
            Id: true,
            UserId: true,
            PostId: true,
            Content: true,
            createdAt: true,
          },
        },
        PostTags: {
          select: {
            InterestTags: {
              select: {
                Id: true,
                Name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async likePost(postId: string, userId: string) {
    return this.prisma.likes.create({
      data: { PostId: postId, UserId: userId },
    });
  }

  async unlikePost(postId: string, userId: string) {
    return this.prisma.likes.delete({
      where: {
        PostId_UserId: {
          PostId: postId,
          UserId: userId,
        },
      },
    });
  }

  async commentPost(postId: string, userId: string, content: string) {
    return this.prisma.comments.create({
      data: {
        PostId: postId,
        UserId: userId,
        Content: content,
      },
    });
  }

  async getComments(postId: string) {
    return this.prisma.comments.findMany({
      where: { PostId: postId },
      orderBy: { createdAt: 'desc' },
      select: {
        Id: true,
        Content: true,
        createdAt: true,
        Users: {
          select: {
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
  }

  async isPostLiked(postId: string, userId: string) {
    const like = await this.prisma.likes.findUnique({
      where: {
        PostId_UserId: { PostId: postId, UserId: userId },
      },
    });

    return { isLiked: !!like };
  }
}
