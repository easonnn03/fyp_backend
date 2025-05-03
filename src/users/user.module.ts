import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/*
controller: handles http routing 
module: bundles related files
service: business logic
*/

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
