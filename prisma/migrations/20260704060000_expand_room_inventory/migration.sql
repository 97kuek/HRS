-- Add three room types and expand inventory for the existing types.
INSERT INTO "room_types" ("id", "name", "capacity", "base_rate", "created_at", "updated_at")
VALUES
  ('seed-comfort-double', 'コンフォートダブル', 2, 16000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-family-room', 'ファミリールーム', 4, 22000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-premium-twin', 'プレミアムツイン', 3, 28000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "rooms" ("id", "room_number", "room_type_id", "created_at", "updated_at")
SELECT
  'seed-room-' || inventory.room_number,
  inventory.room_number,
  "room_types"."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('0304', 'スタンダードシングル'), ('0305', 'スタンダードシングル'),
    ('0401', 'コンフォートダブル'), ('0402', 'コンフォートダブル'),
    ('0403', 'コンフォートダブル'), ('0404', 'コンフォートダブル'),
    ('0504', 'スーペリアダブル'), ('0505', 'スーペリアダブル'),
    ('0701', 'ファミリールーム'), ('0702', 'ファミリールーム'),
    ('0703', 'ファミリールーム'),
    ('0807', 'デラックスツイン'), ('0808', 'デラックスツイン'),
    ('0901', 'プレミアムツイン'), ('0902', 'プレミアムツイン'),
    ('0903', 'プレミアムツイン'),
    ('1003', '和室スイート')
) AS inventory(room_number, room_type_name)
JOIN "room_types" ON "room_types"."name" = inventory.room_type_name
ON CONFLICT ("room_number") DO NOTHING;
