import { Controller, UseGuards, Get, Query, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FriendService } from './friend.service';
import { AddFriendDto } from './dto/add-friend.dto';
import { AS } from './dto/friendship-requests.dto';

@UseGuards(JwtAuthGuard)
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('add-friend')
  addFriend(@Body() addFriendDto: AddFriendDto) {
    return this.friendService.addFriend(addFriendDto);
  }

  @Post('approve')
  approveFriendRequest(@Body() as: AS) {
    return this.friendService.approveFriendRequest(as);
  }

  @Post('reject')
  rejectFriendRequest(@Body() as: AS) {
    //send notification to sender here
    return this.friendService.rejectFriendRequest(as);
  }

  @Get('Friend-List')
  getFriendList(@Query('currentUserId') currentUserId: string) {
    return this.friendService.getFriendListById(currentUserId);
  }

  @Get('Friend-Request')
  getFriendRequest(@Query('currentUserId') currentUserId: string) {
    return this.friendService.getFriendRequestById(currentUserId);
  }

  @Post('unfriend')
  async unfriend(@Body() as: AS) {
    return this.friendService.unfriend(as);
  }
}
