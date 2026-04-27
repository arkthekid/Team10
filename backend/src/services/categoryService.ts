import { AppDataSource } from "../config/data-source";
import { CategoryEntity } from "../entities/Category";
import { AppError } from "../utils/AppError";

const getRepo = () => AppDataSource.getRepository(CategoryEntity);

export async function createCategory(categoryName: string) {
    const repo = getRepo();

    const find = await repo.findOne({ where: { name: categoryName }});
    if (find) throw new AppError("Category already existed", 409);

    const category = repo.create({ name: categoryName })
    return await repo.save(category);
}