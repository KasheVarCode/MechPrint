from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def trim_transparency(img: Image.Image, pad: int = 8) -> Image.Image:
	"""
	Обрезает прозрачные поля по alpha-каналу и добавляет небольшой pad.
	Если альфы нет — возвращает как есть.
	"""
	if img.mode not in ("RGBA", "LA"):
		img = img.convert("RGBA")

	alpha = img.getchannel("A")
	bbox = alpha.getbbox()
	if not bbox:
		return img

	left, top, right, bottom = bbox
	left = max(0, left - pad)
	top = max(0, top - pad)
	right = min(img.width, right + pad)
	bottom = min(img.height, bottom + pad)
	return img.crop((left, top, right, bottom))


def split_grid(
	src_path: Path,
	out_dir: Path,
	cols: int,
	rows: int,
	names: list[str],
	trim: bool,
) -> None:
	out_dir.mkdir(parents=True, exist_ok=True)

	with Image.open(src_path) as im:
		im = im.convert("RGBA")

		cell_w = im.width / cols
		cell_h = im.height / rows

		for idx, name in enumerate(names):
			col = idx % cols
			row = idx // cols
			if row >= rows:
				break

			left = round(col * cell_w)
			top = round(row * cell_h)
			right = round((col + 1) * cell_w)
			bottom = round((row + 1) * cell_h)

			crop = im.crop((left, top, right, bottom))
			if trim:
				crop = trim_transparency(crop, pad=10)

			out_path = out_dir / f"{name}.webp"
			crop.save(out_path, "WEBP", quality=92, method=6)


def main() -> None:
	parser = argparse.ArgumentParser(description="Split a sprite image into grid icons.")
	parser.add_argument("--src", required=True, help="Source sprite path")
	parser.add_argument("--out", required=True, help="Output directory")
	parser.add_argument("--cols", type=int, default=3)
	parser.add_argument("--rows", type=int, default=2)
	parser.add_argument("--no-trim", action="store_true", help="Disable alpha-trimming")
	args = parser.parse_args()

	src = Path(args.src).resolve()
	out = Path(args.out).resolve()

	# Порядок: слева-направо, сверху-вниз (3×2)
	names = [
		"requests",  # Заявки
		"fleet",  # Парк техники
		"security",  # Безопасность
		"docs",  # Документация
		"map",  # Карта
		"support",  # Поддержка
	]

	split_grid(
		src_path=src,
		out_dir=out,
		cols=args.cols,
		rows=args.rows,
		names=names,
		trim=not args.no_trim,
	)


if __name__ == "__main__":
	main()

