import {
  Controller,
  UseGuards,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  BadRequestException,
  Query,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-user-post.dto';
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create-post')
  @UseInterceptors(
    FilesInterceptor('files', 10, { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let interestTagIds: string[];

    try {
      interestTagIds = JSON.parse(createPostDto.interestTagIds) as string[];
    } catch (e) {
      throw new BadRequestException('Invalid tag data.' + e);
    }
    return this.postsService.createPost(
      createPostDto.userId,
      createPostDto.content,
      files,
      interestTagIds,
    );
  }

  @Get('get-all-tags')
  getAllTags() {
    return this.postsService.getAllTags();
  }

  @Get('user-posts')
  async getUserPosts(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('User ID is required');
    return this.postsService.getPostsByUser(userId);
  }

  @Put('update-post')
  async updatePost(@Body() body: UpdatePostDto) {
    return this.postsService.updatePost(
      body.postId,
      body.userId,
      body.content,
      body.interestTagIds,
    );
  }

  @Delete('delete-post/:postId/:userId')
  async deletePost(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.postsService.deletePost(postId, userId);
  }

  @Get('feed')
  async getMainFeed(
    @Query('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.getMainFeed(userId, cursor, Number(limit));
  }

  @Get('/get-post')
  async getPost(@Query('postId') postId: string) {
    return this.postsService.getPostById(postId);
  }

  @Post('like')
  likePost(@Body() dto: { postId: string; userId: string }) {
    return this.postsService.likePost(dto.postId, dto.userId);
  }

  @Delete('unlike')
  unlikePost(@Body() dto: { postId: string; userId: string }) {
    return this.postsService.unlikePost(dto.postId, dto.userId);
  }

  @Post('comment')
  commentPost(
    @Body() dto: { postId: string; currentUserId: string; content: string },
  ) {
    return this.postsService.commentPost(
      dto.postId,
      dto.currentUserId,
      dto.content,
    );
  }

  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string) {
    return this.postsService.getComments(postId);
  }

  @Get('is-liked')
  async isPostLiked(
    @Query('postId') postId: string,
    @Query('userId') userId: string,
  ) {
    return this.postsService.isPostLiked(postId, userId);
  }
}
