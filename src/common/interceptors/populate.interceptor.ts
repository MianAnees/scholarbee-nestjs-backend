import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModuleRef } from '@nestjs/core';
import { University } from '../../universities/schemas/university.schema';
import { Campus } from '../../campuses/schemas/campus.schema';

@Injectable()
export class PopulateInterceptor implements NestInterceptor {
    private readonly populationMap = {
        universities: ['address_id'],
        campuses: ['university_id', 'address_id'],
        'academic-departments': ['campus_id'],
        users: []
    };

    private readonly modelMap = {
        'university_id': { model: 'University', collection: 'universities' },
        'campus_id': { model: 'Campus', collection: 'campuses' },
        'address_id': { model: 'Address', collection: 'addresses' },
    };

    constructor(
        private moduleRef: ModuleRef,
        @InjectModel(University.name) private universityModel: Model<University>,
        @InjectModel(Campus.name) private campusModel: Model<Campus>
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const depth = parseInt(request.query.depth) || 0;

        if (depth <= 0) {
            return next.handle();
        }

        return next.handle().pipe(
            map(async (data) => {
                if (!data) return data;

                // Handle both single items and collections
                if (data.data && Array.isArray(data.data)) {
                    data.data = await this.populateData(data.data, depth, request.path);
                    return data;
                } else if (Array.isArray(data)) {
                    return await this.populateData(data, depth, request.path);
                } else {
                    return await this.populateItem(data, depth, request.path);
                }
            })
        );
    }

    private async populateData(items: any[], depth: number, path: string): Promise<any[]> {
        if (!items.length) return items;

        const populatedItems = [];
        for (const item of items) {
            populatedItems.push(await this.populateItem(item, depth, path));
        }
        return populatedItems;
    }

    private async populateItem(item: any, depth: number, path: string): Promise<any> {
        if (!item || depth <= 0) return item;

        const resourceType = this.getResourceTypeFromPath(path);
        const fieldsToPopulate = this.populationMap[resourceType] || [];

        const populatedItem = { ...item };

        for (const field of fieldsToPopulate) {
            if (populatedItem[field] && this.modelMap[field]) {
                const { model, collection } = this.modelMap[field];
                try {
                    let modelInstance;

                    // Direct access to injected models
                    if (model === 'University') {
                        modelInstance = this.universityModel;
                    } else if (model === 'Campus') {
                        modelInstance = this.campusModel;
                    } else {
                        // Fallback to moduleRef for other models
                        modelInstance = this.moduleRef.get(`${model}Model`, { strict: false });
                    }

                    if (modelInstance) {
                        const relatedItem = await modelInstance.findById(populatedItem[field]).lean();
                        if (relatedItem) {
                            populatedItem[field] = relatedItem;

                            // Recursively populate nested relationships
                            if (depth > 1) {
                                const nestedResourceType = collection;
                                const nestedFieldsToPopulate = this.populationMap[nestedResourceType] || [];

                                for (const nestedField of nestedFieldsToPopulate) {
                                    if (populatedItem[field][nestedField] && this.modelMap[nestedField]) {
                                        const { model: nestedModel } = this.modelMap[nestedField];
                                        let nestedModelInstance;

                                        if (nestedModel === 'University') {
                                            nestedModelInstance = this.universityModel;
                                        } else if (nestedModel === 'Campus') {
                                            nestedModelInstance = this.campusModel;
                                        } else {
                                            nestedModelInstance = this.moduleRef.get(`${nestedModel}Model`, { strict: false });
                                        }

                                        if (nestedModelInstance) {
                                            const nestedRelatedItem = await nestedModelInstance.findById(populatedItem[field][nestedField]).lean();
                                            if (nestedRelatedItem) {
                                                populatedItem[field][nestedField] = nestedRelatedItem;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error populating ${field}:`, error);
                }
            }
        }

        return populatedItem;
    }

    private getResourceTypeFromPath(path: string): string {
        // Extract resource type from path (e.g., /api/universities -> universities)
        const parts = path.split('/').filter(p => p);
        return parts[parts.length - 1] || '';
    }
} 