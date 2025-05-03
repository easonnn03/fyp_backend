import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto } from './dto/search.dto';
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}
  async search({ query, type, cursor, limit = 10 }: SearchDto) {
    const take = Math.min(limit, 20);
    const keyword = query?.trim() || '';

    const usersPromise =
      !type || type === 'user'
        ? this.prisma.users.findMany({
            where: { Username: { contains: keyword } },
            include: {
              Profiles: { select: { ProfileImageUrl: true } }, // get profile avatar too
            },
            orderBy: { Username: 'asc' },
            take,
            ...(cursor ? { skip: 1, cursor: { Id: cursor } } : {}),
          })
        : Promise.resolve([]);

    const postsPromise =
      !type || type === 'post'
        ? this.prisma.posts.findMany({
            where: { Content: { contains: keyword } },
            include: {
              PostMedia: { take: 1 }, // only first image/video preview
              Users: {
                select: {
                  Username: true,
                  Profiles: { select: { ProfileImageUrl: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor ? { skip: 1, cursor: { Id: cursor } } : {}),
          })
        : Promise.resolve([]);

    const tagsPromise =
      !type || type === 'tag'
        ? this.prisma.interestTags.findMany({
            where: {
              Name: { contains: keyword.replace('#', '') },
            },
            orderBy: { Name: 'asc' },
            take,
            ...(cursor ? { skip: 1, cursor: { Id: cursor } } : {}),
          })
        : Promise.resolve([]);

    const [users, posts, tags] = await Promise.all([
      usersPromise,
      postsPromise,
      tagsPromise,
    ]);

    return {
      users,
      posts,
      tags,
      nextCursor: null,
    };
  }
}
