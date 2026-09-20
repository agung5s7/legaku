-- ==============================================================================
-- LEGAKU — Seed Data: Default Categories & Development Seed
-- ==============================================================================

-- Default Expense Categories
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Makan & Minum', 'expense', 'Utensils', true),
('Rumah Tangga', 'expense', 'Home', true),
('Transportasi', 'expense', 'Car', true),
('Pendidikan', 'expense', 'GraduationCap', true),
('Kesehatan', 'expense', 'HeartPulse', true),
('Belanja', 'expense', 'ShoppingBag', true),
('Tagihan', 'expense', 'Receipt', true),
('Hiburan', 'expense', 'Gamepad2', true),
('Keluarga', 'expense', 'Users', true),
('Lainnya', 'expense', 'MoreHorizontal', true)
ON CONFLICT DO NOTHING;

-- Default Income Categories
INSERT INTO public.categories (name, type, icon, is_default) VALUES
('Gaji', 'income', 'Briefcase', true),
('Bisnis', 'income', 'Store', true),
('Freelance', 'income', 'Laptop', true),
('Bonus', 'income', 'Gift', true),
('Investasi', 'income', 'TrendingUp', true),
('Lainnya', 'income', 'PlusCircle', true)
ON CONFLICT DO NOTHING;
