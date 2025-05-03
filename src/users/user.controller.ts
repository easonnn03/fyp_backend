import {
  Controller,
  UseGuards,
  Get,
  Param,
  Query,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('Home-UserProfile/:id')
  getHomeUserProfile(@Param('id') id: string) {
    return this.userService.getHomeUserProfileById(id);
  }

  @Get('Profile-Header')
  getProfileHeader(
    @Query('profileId') profileId: string,
    @Query('currentUserId') currentUserId: string,
  ) {
    return this.userService.getProfileHeaderById(profileId, currentUserId);
  }

  @Get('Profile-Details')
  getProfileDetails(@Query('profileId') profileId: string) {
    return this.userService.getProfileDetailsById(profileId);
  }

  @Post('update-Profile')
  updateUserProfile(@Body() updateProfileDto: UpdateUserDto) {
    return this.userService.updateUserProfile(updateProfileDto);
  }

  @Get('Profile-Image')
  getProfileImage(@Query('currentUserId') currentUserId: string) {
    return this.userService.getProfileImageById(currentUserId);
  }

  @Get('Notifications')
  getNotifications(@Query('currentUserId') currentUserId: string) {
    return this.userService.getNotificationsById(currentUserId);
  }

  @Post('markAsRead')
  updateNotificationStatus(@Body('notificationId') notificationId: string) {
    return this.userService.updateNotificationAsRead(notificationId);
  }

  @Get('getAllTags')
  getAllTags() {
    return this.userService.getAllTags();
  }

  @Post('upload-cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!file || !userId) {
      throw new BadRequestException('File and userId are required');
    }

    return this.userService.uploadCover(file, userId);
  }

  @Post('upload-profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!file || !userId) {
      throw new BadRequestException('File and userId are required');
    }

    return this.userService.uploadProfile(file, userId);
  }
}
