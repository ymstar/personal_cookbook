import pg from "pg";
import type { Recipe, RecipeFormData, Ingredient } from "./types";

// 全局单例 Pool，避免 serverless 冷启动时重复创建
const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };
const pool =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

// ── 食材 ──

export async function getIngredients(): Promise<Ingredient[]> {
  const { rows } = await pool.query(
    "SELECT id, category, name, sort_order FROM ingredients ORDER BY sort_order, id",
  );
  return rows as Ingredient[];
}

export async function addIngredient(
  category: string,
  name: string,
): Promise<Ingredient> {
  const { rows } = await pool.query(
    "INSERT INTO ingredients (category, name, sort_order) VALUES ($1, $2, 0) RETURNING id, category, name, sort_order",
    [category, name],
  );
  return rows[0] as Ingredient;
}

export async function deleteIngredient(id: number): Promise<void> {
  await pool.query("DELETE FROM ingredients WHERE id = $1", [id]);
}

// ── 菜谱 ──

export async function getRecipes(): Promise<Recipe[]> {
  const { rows: recipes } = await pool.query(
    "SELECT id, title, category, last_practice, steps, notes, created_at, updated_at FROM recipes ORDER BY created_at DESC, id DESC",
  );

  const result: Recipe[] = [];
  for (const r of recipes) {
    const { rows: ings } = await pool.query(
      "SELECT id, recipe_id, ingredient_id, name, quantity, sort_order FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order, id",
      [r.id],
    );
    const { rows: imgs } = await pool.query(
      "SELECT id, recipe_id, url, alt, sort_order FROM recipe_images WHERE recipe_id = $1 ORDER BY sort_order, id",
      [r.id],
    );
    result.push({ ...r, ingredients: ings, images: imgs } as Recipe);
  }
  return result;
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const { rows } = await pool.query(
    "SELECT id, title, category, last_practice, steps, notes, created_at, updated_at FROM recipes WHERE id = $1",
    [id],
  );
  if (!rows.length) return null;
  const r = rows[0];

  const { rows: ings } = await pool.query(
    "SELECT id, recipe_id, ingredient_id, name, quantity, sort_order FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order, id",
    [id],
  );

  const { rows: imgs } = await pool.query(
    "SELECT id, recipe_id, url, alt, sort_order FROM recipe_images WHERE recipe_id = $1 ORDER BY sort_order, id",
    [id],
  );

  return { ...r, ingredients: ings, images: imgs } as Recipe;
}

export async function createRecipe(data: RecipeFormData): Promise<number> {
  const { rows } = await pool.query(
    "INSERT INTO recipes (title, category, last_practice, steps, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [data.title, data.category, data.last_practice, data.steps, data.notes],
  );
  const id = rows[0].id;

  await saveRecipeRelations(id, data);
  return id;
}

export async function updateRecipe(
  id: number,
  data: RecipeFormData,
): Promise<void> {
  await pool.query(
    "UPDATE recipes SET title = $1, category = $2, last_practice = $3, steps = $4, notes = $5, updated_at = NOW() WHERE id = $6",
    [data.title, data.category, data.last_practice, data.steps, data.notes, id],
  );

  // 清掉旧关联再重写
  await pool.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
  await pool.query("DELETE FROM recipe_images WHERE recipe_id = $1", [id]);
  await saveRecipeRelations(id, data);
}

export async function deleteRecipe(id: number): Promise<void> {
  await pool.query("DELETE FROM recipes WHERE id = $1", [id]);
}

async function saveRecipeRelations(id: number, data: RecipeFormData): Promise<void> {
  for (let i = 0; i < data.ingredients.length; i++) {
    const ing = data.ingredients[i];
    if (!ing.name.trim()) continue;
    await pool.query(
      "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, name, quantity, sort_order) VALUES ($1, $2, $3, $4, $5)",
      [id, ing.ingredient_id, ing.name, ing.quantity, i],
    );
  }

  for (let i = 0; i < data.images.length; i++) {
    const img = data.images[i];
    if (!img.url) continue;
    await pool.query(
      "INSERT INTO recipe_images (recipe_id, url, alt, sort_order) VALUES ($1, $2, $3, $4)",
      [id, img.url, img.alt, i],
    );
  }
}
