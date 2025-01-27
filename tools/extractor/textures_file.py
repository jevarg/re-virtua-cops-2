from dataclasses import dataclass
import os
from pathlib import Path
import struct
from typing import Optional
from palette import ColorPalette, RGBColor
from context import Context
from PIL import Image

@dataclass
class TextureFlags():
    raw_val: int

    def alpha(self) -> bool:
        return self.raw_val & 0x2

    def ui(self) -> bool:
        return self.raw_val & 0x4

    def __repr__(self) -> str:
        r = ""

        if self.alpha():
            r += "alpha"

        return r

class Texture():
    FORMAT = "HHB7xB3x"
    BYTES_SIZE = struct.calcsize(FORMAT)

    data: Optional[bytearray] = None

    id: int
    width: int
    height: int
    palette_offset: int
    flags: TextureFlags
    offset: int

    def __repr__(self) -> str:
        return f"Texture(id={self.id} width={self.width} height={self.height} palette_offset={self.palette_offset} flags={self.flags})"

    def __init__(self, id: int, w: int, h: int, palette_offset: int, flags: int) -> None:
        self.id = id
        self.width = w
        self.height = h
        self.palette_offset = palette_offset
        self.flags = TextureFlags(flags)

class Tile():
    data: Optional[bytes] = None
    textures: list[Texture] = list()

class TexturesFile():
    FORMAT = "IIIIII"
    BYTES_SIZE = struct.calcsize(FORMAT)

    __to_unpack_nb: int

    __file_name: str
    __palette_name: str
    __textures: list[Texture]
    # __palettes: dict[int, ColorPalette]
    __textures_data: bytes
    __palette_data: bytes
    __atlas_data: bytearray

    __unpacked_textures: list[int]

    def __repr__(self) -> str:
        return f"TexturesFile(file={self.__file_name} palette={self.__palette_name} textures={len(self.__textures)} items)"

    def __init__(self, file_name: str, palette_name: str, textures: list[Texture], packed_count: int) -> None:
        self.__file_name = file_name
        self.__palette_name = palette_name
        self.__textures = textures
        self.__atlas_data = bytearray(0x400000) # 4Mo
        self.__unpacked_textures = []
        self.__to_unpack_nb = packed_count

        self.__load()

    def __load(self):
        file_path = os.path.join(Context.bin_dir, self.__file_name)
        palette_path = os.path.join(Context.bin_dir, self.__palette_name)

        with open(file_path, "rb") as f:
            self.__textures_data = f.read()
        with open(palette_path, "rb") as f:
            self.__palette_data = f.read()

        for t in self.__textures:
            indices = struct.unpack_from(f"{t.width * t.height}B", self.__textures_data, t.offset)
            t.data = bytearray()
            pixels = list()
            for i in indices:
                if t.flags.alpha() and i == 0:
                    pixels.extend([0, 0, 0, 0])
                    continue

                (r, g, b) = struct.unpack_from("3Bx", self.__palette_data, (t.palette_offset * 64 + i * 4))
                pixels.extend([r, g, b, 0xff])

            t.data = bytes(pixels)


        # self.__rect_nb = 0
        # self.__pack_textures(0, 0, 0, 256, 256)
        # self.__atlas_data = self.__atlas_data[:(self.__rect_nb + 1) * (256 * 256 * 4)]
        # self.__debug_save()
        # self.export_atlas()

    def __debug_save(self):
        test_path = os.path.join(Context.out_dir, 'test.bin')
        with open(test_path, "w+b") as f:
            f.write(self.__atlas_data)
            # print(f"unpacked {len(self.__unpacked_textures)} textures")
            # print(f"to_unpack: {self.__to_unpack_nb} textures")

    def __pack_textures(self, rect_nb: int, x_off: int, y_off: int, avail_width: int, avail_height: int):
        # print(f"\nx_off: {x_off} y_off: {y_off} avail_width: {avail_width} avail_height: {avail_height}")

        if x_off >= avail_width:
            return

        while y_off < avail_height and self.__to_unpack_nb > 0:

            tex_width = avail_width - x_off
            count = 0
            while count <= 0:
                textures: list[Texture] = None
                while True:
                    if tex_width <= 0:
                        # print(f"skipped {avail_width}")
                        return # done

                    textures = self.__textures.get(tex_width)
                    if textures is not None:
                        break

                    tex_width -= 1

                y_atlas = y_off

                # print(f"tex_width: {tex_width}")

                for t in textures:
                    if t.id in self.__unpacked_textures:
                        continue

                    if t.height > avail_height - y_atlas:
                        continue

                    # for y in range(t.height):
                    #     i = rect_nb * (256 * 256) + (y_atlas + y) * 256
                    #     for x in range(t.width):
                    #         t_pixel = y * t.width + x
                    #         index = struct.unpack_from("B", self.__textures_data, t.offset + t_pixel)[0]
                    #         (r, g, b) = struct.unpack_from("3Bx", self.__palette_data, t.palette_offset * 64 + index * 4)
                    #         self.__atlas_data[(i + x_off + x) * 4] = r
                    #         self.__atlas_data[(i + x_off + x) * 4 + 1] = g
                    #         self.__atlas_data[(i + x_off + x) * 4 + 2] = b

                    #         if t.flags.alpha() and index == 0:
                    #             self.__atlas_data[(i + x_off + x) * 4 + 3] = 0
                    #         else:
                    #             self.__atlas_data[(i + x_off + x) * 4 + 3] = 0xff

                    self.__unpacked_textures.append(t.id)
                    self.__to_unpack_nb -= 1
                    y_atlas += t.height
                    count += 1

                if count > 0:
                    self.__pack_textures(rect_nb, x_off + tex_width, y_off, avail_width, y_atlas)
                    self.__pack_textures(rect_nb, x_off, y_atlas, avail_width, avail_height)
                    break
                else:
                    tex_width -= 1

            if rect_nb > self.__rect_nb:
                self.__rect_nb = rect_nb

            if x_off != 0 or y_off != 0:
                return

            if avail_width != 256 or avail_height != 256:
                return

            if self.__to_unpack_nb <= 0:
                return

            rect_nb += 1

    def __export__texture(self, t: Texture, out_dir: str):
        file_path = os.path.join(out_dir, f'{t.id}.png')

        img = Image.frombytes('RGBA', (t.width, t.height), t.data)
        img.save(file_path)

    def extract(self, id: int):
        out_dir = os.path.join(Context.out_dir, Path(self.__file_name).stem)
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        t = self.__textures[id]
        file_path = os.path.join(out_dir, f'{t.id}.bin')

        with open(file_path, 'w+b') as f:
            f.write(t.data)

    def export(self, id: int = None):
        out_dir = os.path.join(Context.out_dir, Path(self.__file_name).stem)
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        if id is not None:
            t = self.__textures[id]
            self.__export__texture(t, out_dir)
        else:
            for t in self.__textures:
                self.__export__texture(t, out_dir)

    def export_atlas(self):
        if not os.path.exists(Context.out_dir):
            os.makedirs(Context.out_dir)

        file_path = os.path.join(Context.out_dir, f'{self.__file_name}.png')
        img = Image.frombytes('RGBA', (256, len(self.__atlas_data) // 256 // 4), self.__atlas_data)
        img.save(file_path)
