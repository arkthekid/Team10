import { AppDataSource } from "../config/data-source";
import { CategoryEntity } from "../entities/Category";
import { AppError } from "../utils/AppError";

const getRepo = () => AppDataSource.getRepository(CategoryEntity);

export async function createCategory(categoryName: string) {
    const repo = getRepo();

    const find = await repo.findOne({ where: { name: categoryName }});
    if (find) throw new AppError("Category already existed", 409);

    return await repo.save({ name: categoryName}); // create and save
}

export async function getAllCategory() {
    const repo = getRepo();
    return await repo.find({ order: { name: "ASC" } });
}

export async function getCategoryById(categoryId: string) {
    const repo = getRepo();

    const find = await repo.findOneBy({ categoryId });
    if (!find) throw new AppError("Category not found", 404);

    return find;
}

export async function updateCategory(categoryId: string, name: string)  {
    const repo = getRepo();
    const category = await repo.findOneBy({ categoryId });
    if (!category) throw new AppError("Category not found", 404);
    category.name = name;
    return await repo.save(category);
}

export async function deleteCategory(categoryId: string) {
    const repo = getRepo();
    const category = await repo.findOneBy({ categoryId });
    if (!category) throw new AppError("Category not found", 404);
    return await repo.remove(category);
}