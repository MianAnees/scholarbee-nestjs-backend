import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UniversitiesModule } from './universities/universities.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { CampusesModule } from './campuses/campuses.module';
import { AcademicDepartmentsModule } from './academic-departments/academic-departments.module';
import { CommonModule } from './common/common.module';
import { AddressesModule } from './addresses/addresses.module';
import { ChatModule } from './chat/chat.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AdmissionsModule } from './admissions/admissions.module';
import { AdmissionProgramsModule } from './admission-programs/admission-programs.module';
import { ApplicationsModule } from './applications/applications.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { FeesModule } from './fees/fees.module';
import { ProgramTemplatesModule } from './program-templates/program-templates.module';
import { RegionsModule } from './regions/regions.module';
import { StudentScholarshipsModule } from './student-scholarships/student-scholarships.module';
import { ProgramsModule } from './programs/programs.module';
import { BlogPostsModule } from './blog-posts/blog-posts.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { configuration, envValidationSchema } from 'src/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true, // enables variable-expansion in .env files i.e. ${env1}+${env2}
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // This option allows all validation errors to be reported at once, rather than stopping after the first error,
        // allowUnknown: false
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule], // Specifying ConfigModule as an import here is necessary because during the module initialization, the ConfigService is not yet available as a Global Dependency Import
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // TODO: Use configuration() instead of configService.get<string>('MONGODB_URI')
        // uri: configuration().database.uri,
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    UniversitiesModule,
    OrganizationsModule,
    CampusesModule,
    AcademicDepartmentsModule,
    AddressesModule,
    ChatModule,
    AdmissionsModule,
    AdmissionProgramsModule,
    ApplicationsModule,
    ContactUsModule,
    FeesModule,
    ProgramTemplatesModule,
    RegionsModule,
    StudentScholarshipsModule,
    ScholarshipsModule,
    ProgramsModule,
    BlogPostsModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
