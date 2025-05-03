import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FriendModule } from './friends/friend.module';
import { PostsModule } from './posts/posts.module';
import { SearchModule } from './search/search.module';
import { wellbeingModule } from './wellbeing/wellbeing.module';
//decorators: add characteristics like an interface without modifying the class itself
//modules: group related function into a unit (structure your function)
@Module({
  imports: [
    UserModule,
    PrismaModule,
    AuthModule,
    UserModule,
    FriendModule,
    PostsModule,
    SearchModule,
    wellbeingModule,
  ],
  controllers: [],
  providers: [],

  //use hotkey ctrl + . to generate import folder on the top
})
export class AppModule {}
