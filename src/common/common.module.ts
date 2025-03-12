import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PopulateInterceptor } from './interceptors/populate.interceptor';
import { University, UniversitySchema } from '../universities/schemas/university.schema';
import { Campus, CampusSchema } from '../campuses/schemas/campus.schema';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: University.name, schema: UniversitySchema },
            { name: Campus.name, schema: CampusSchema },
        ]),
    ],
    providers: [PopulateInterceptor],
    exports: [PopulateInterceptor],
})
export class CommonModule { } 