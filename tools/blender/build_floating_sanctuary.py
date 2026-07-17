from __future__ import annotations

import math
import random
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SCENARIO_DIR = ROOT / "public" / "assets" / "scenarios" / "floating-sanctuary"
TEXTURE_DIR = SCENARIO_DIR / "textures"
SOURCE_DIR = ROOT / "art" / "blender"
SCREENSHOT_DIR = ROOT / "docs" / "screenshots"
GLB_PATH = SCENARIO_DIR / "floating-sanctuary.glb"
RAW_GLB_PATH = SCENARIO_DIR / "floating-sanctuary.raw.glb"
BLEND_PATH = SOURCE_DIR / "floating-sanctuary.blend"
PREVIEW_PATH = SCREENSHOT_DIR / "floating-sanctuary-blender-preview.png"

STONE_DIFFUSE = TEXTURE_DIR / "sanctuary_stone_basecolor.png"
STONE_NORMAL = TEXTURE_DIR / "stone_tile_wall_nor_gl_1k.jpg"
STONE_ROUGHNESS = TEXTURE_DIR / "stone_tile_wall_rough_1k.jpg"
SKY_HDR = SCENARIO_DIR / "sky" / "qwantani_sunset_puresky_2k.hdr"

random.seed(88731)


def ensure_directories() -> None:
    for directory in (SCENARIO_DIR, SOURCE_DIR, SCREENSHOT_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def world_to_blender(point: tuple[float, float, float]) -> tuple[float, float, float]:
    x, height, depth = point
    return (x, -depth, height)


def principled(material: bpy.types.Material) -> bpy.types.ShaderNodeBsdfPrincipled:
    node = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
    if not isinstance(node, bpy.types.ShaderNodeBsdfPrincipled):
        raise RuntimeError(f"Material {material.name} has no Principled BSDF node")
    return node


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = principled(material)
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic

    if emission is not None:
        emission_input = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        strength_input = shader.inputs.get("Emission Strength")
        if emission_input is not None:
            emission_input.default_value = emission
        if strength_input is not None:
            strength_input.default_value = emission_strength

    return material


def make_stone_floor_material() -> bpy.types.Material:
    material = bpy.data.materials.new("M_StoneFloor_PBR")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = principled(material)

    diffuse = nodes.new("ShaderNodeTexImage")
    diffuse.name = "Stone Base Color"
    diffuse.image = bpy.data.images.load(str(STONE_DIFFUSE), check_existing=True)
    diffuse.image.colorspace_settings.name = "sRGB"
    links.new(diffuse.outputs["Color"], shader.inputs["Base Color"])
    shader.inputs["Base Color"].default_value = (0.48, 0.59, 0.72, 1.0)

    roughness = nodes.new("ShaderNodeTexImage")
    roughness.name = "Stone Roughness"
    roughness.image = bpy.data.images.load(str(STONE_ROUGHNESS), check_existing=True)
    roughness.image.colorspace_settings.name = "Non-Color"
    links.new(roughness.outputs["Color"], shader.inputs["Roughness"])

    normal_texture = nodes.new("ShaderNodeTexImage")
    normal_texture.name = "Stone Normal"
    normal_texture.image = bpy.data.images.load(str(STONE_NORMAL), check_existing=True)
    normal_texture.image.colorspace_settings.name = "Non-Color"
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.62
    links.new(normal_texture.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])
    shader.inputs["Metallic"].default_value = 0.03
    return material


def add_export_object(obj: bpy.types.Object, group: str) -> bpy.types.Object:
    obj["sanctuary_export"] = True
    obj["export_group"] = group
    return obj


def assign_materials(obj: bpy.types.Object, materials: list[bpy.types.Material]) -> None:
    for material in materials:
        obj.data.materials.append(material)


def apply_bevel(obj: bpy.types.Object, width: float, segments: int = 2) -> None:
    if width <= 0:
        return
    modifier = obj.modifiers.new(name="Architectural bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    modifier.angle_limit = math.radians(24)


def cube_project_uv(obj: bpy.types.Object, cube_size: float = 3.2) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=cube_size, correct_aspect=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def create_box(
    name: str,
    center: tuple[float, float, float],
    size: tuple[float, float, float],
    material: bpy.types.Material,
    group: str,
    rotation_y: float = 0.0,
    bevel: float = 0.05,
    uv_size: float = 3.2,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=world_to_blender(center))
    obj = bpy.context.object
    obj.name = name
    width, height, depth = size
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = -rotation_y
    obj.data.materials.append(material)
    apply_bevel(obj, bevel)
    cube_project_uv(obj, uv_size)
    return add_export_object(obj, group)


def create_cylinder(
    name: str,
    center: tuple[float, float, float],
    radius: float,
    height: float,
    material: bpy.types.Material,
    group: str,
    vertices: int = 12,
    bevel: float = 0.03,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=height,
        location=world_to_blender(center),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    apply_bevel(obj, bevel)
    cube_project_uv(obj, 2.4)
    return add_export_object(obj, group)


def create_cone(
    name: str,
    center: tuple[float, float, float],
    radius_bottom: float,
    radius_top: float,
    height: float,
    material: bpy.types.Material,
    group: str,
    vertices: int = 8,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=height,
        location=world_to_blender(center),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    apply_bevel(obj, 0.025)
    cube_project_uv(obj, 2.6)
    return add_export_object(obj, group)


def create_prism(
    name: str,
    footprint: list[tuple[float, float]],
    top_height: float,
    thickness: float,
    top_material: bpy.types.Material,
    side_material: bpy.types.Material,
    group: str,
    bevel: float = 0.08,
) -> bpy.types.Object:
    count = len(footprint)
    bottom_height = top_height - thickness
    top_vertices = [(x, -depth, top_height) for x, depth in footprint]
    bottom_vertices = [(x, -depth, bottom_height) for x, depth in footprint]
    vertices = top_vertices + bottom_vertices
    faces: list[tuple[int, ...]] = [tuple(reversed(range(count))), tuple(range(count, count * 2))]

    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, count + index, count + next_index, next_index))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(top_material)
    mesh.materials.append(side_material)
    mesh.polygons[0].material_index = 0
    for polygon in mesh.polygons[1:]:
        polygon.material_index = 1
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, bevel)
    cube_project_uv(obj, 3.6)
    return add_export_object(obj, group)


def bridge_footprint(
    start: tuple[float, float],
    end: tuple[float, float],
    width: float,
) -> list[tuple[float, float]]:
    dx = end[0] - start[0]
    dz = end[1] - start[1]
    length = math.hypot(dx, dz)
    perpendicular_x = -dz / length * width * 0.5
    perpendicular_z = dx / length * width * 0.5
    return [
        (start[0] + perpendicular_x, start[1] + perpendicular_z),
        (end[0] + perpendicular_x, end[1] + perpendicular_z),
        (end[0] - perpendicular_x, end[1] - perpendicular_z),
        (start[0] - perpendicular_x, start[1] - perpendicular_z),
    ]


def create_bridge(
    name: str,
    start: tuple[float, float],
    end: tuple[float, float],
    width: float,
    top_height: float,
    floor_material: bpy.types.Material,
    side_material: bpy.types.Material,
    gold_material: bpy.types.Material,
) -> None:
    footprint = bridge_footprint(start, end, width)
    create_prism(name, footprint, top_height, 0.48, floor_material, side_material, "bridge", 0.055)

    dx = end[0] - start[0]
    dz = end[1] - start[1]
    length = math.hypot(dx, dz)
    angle = math.atan2(dx, dz)
    midpoint = ((start[0] + end[0]) * 0.5, top_height + 0.035, (start[1] + end[1]) * 0.5)
    for offset in (-width * 0.37, width * 0.37):
        offset_x = math.cos(angle) * offset
        offset_z = -math.sin(angle) * offset
        create_box(
            f"{name}_GoldRail_{offset:+.2f}",
            (midpoint[0] + offset_x, midpoint[1], midpoint[2] + offset_z),
            (0.055, 0.07, length * 0.86),
            gold_material,
            "gold",
            rotation_y=angle,
            bevel=0.012,
            uv_size=1.0,
        )


def create_torus(
    name: str,
    center: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    material: bpy.types.Material,
    group: str,
    major_segments: int = 48,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=8,
        location=world_to_blender(center),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return add_export_object(obj, group)


def create_medallion(
    name: str,
    center: tuple[float, float, float],
    radius: float,
    gold_material: bpy.types.Material,
    rune_material: bpy.types.Material,
    prominent: bool = False,
) -> None:
    x, height, depth = center
    create_torus(f"{name}_Outer", (x, height + 0.025, depth), radius, 0.024, gold_material, "gold")
    create_torus(f"{name}_Inner", (x, height + 0.028, depth), radius * 0.46, 0.015, rune_material, "rune")
    spoke_count = 8 if prominent else 4
    for index in range(spoke_count):
        angle = index * math.tau / spoke_count
        radial_center = radius * 0.7
        create_box(
            f"{name}_Spoke_{index:02d}",
            (
                x + math.sin(angle) * radial_center,
                height + 0.026,
                depth + math.cos(angle) * radial_center,
            ),
            (0.026, 0.026, radius * 0.34),
            gold_material,
            "gold",
            rotation_y=angle,
            bevel=0.005,
            uv_size=0.5,
        )


def create_column(
    name: str,
    center_x: float,
    base_height: float,
    center_depth: float,
    height: float,
    radius: float,
    stone_material: bpy.types.Material,
    dark_material: bpy.types.Material,
    gold_material: bpy.types.Material,
    broken: bool = False,
) -> None:
    create_cylinder(
        f"{name}_Foot",
        (center_x, base_height + 0.16, center_depth),
        radius * 1.48,
        0.32,
        dark_material,
        "stone_detail",
        vertices=8,
        bevel=0.035,
    )
    create_cylinder(
        f"{name}_Base",
        (center_x, base_height + 0.42, center_depth),
        radius * 1.2,
        0.28,
        stone_material,
        "stone_detail",
        vertices=8,
        bevel=0.035,
    )
    shaft_height = height - (0.38 if broken else 0.1)
    create_cylinder(
        f"{name}_Shaft",
        (center_x, base_height + 0.55 + shaft_height * 0.5, center_depth),
        radius,
        shaft_height,
        stone_material,
        "stone_detail",
        vertices=10,
        bevel=0.025,
    )
    for level in (base_height + 0.68, base_height + height * 0.7):
        create_cylinder(
            f"{name}_GoldBand_{level:.2f}",
            (center_x, level, center_depth),
            radius * 1.07,
            0.075,
            gold_material,
            "gold",
            vertices=10,
            bevel=0.012,
        )
    if not broken:
        create_cone(
            f"{name}_Crown",
            (center_x, base_height + height + 0.45, center_depth),
            radius * 1.05,
            0.035,
            0.9,
            dark_material,
            "stone_detail",
            vertices=8,
        )


def create_arch_band(
    name: str,
    center_x: float,
    center_height: float,
    center_depth: float,
    outer_radius: float,
    inner_radius: float,
    depth: float,
    material: bpy.types.Material,
    group: str,
    segments: int = 32,
    rotation_y: float = 0.0,
) -> bpy.types.Object:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    cosine = math.cos(rotation_y)
    sine = math.sin(rotation_y)
    for depth_offset in (-depth * 0.5, depth * 0.5):
        for radius in (outer_radius, inner_radius):
            for index in range(segments + 1):
                angle = math.pi * index / segments
                local_x = math.cos(angle) * radius
                world_point = (
                    center_x + cosine * local_x + sine * depth_offset,
                    center_height + math.sin(angle) * radius,
                    center_depth - sine * local_x + cosine * depth_offset,
                )
                vertices.append(world_to_blender(world_point))

    strip = segments + 1
    front_outer = 0
    front_inner = strip
    back_outer = strip * 2
    back_inner = strip * 3
    for index in range(segments):
        next_index = index + 1
        faces.append((front_outer + index, front_outer + next_index, front_inner + next_index, front_inner + index))
        faces.append((back_inner + index, back_inner + next_index, back_outer + next_index, back_outer + index))
        faces.append((front_outer + index, back_outer + index, back_outer + next_index, front_outer + next_index))
        faces.append((front_inner + next_index, back_inner + next_index, back_inner + index, front_inner + index))
    faces.append((front_outer, front_inner, back_inner, back_outer))
    faces.append((front_outer + segments, back_outer + segments, back_inner + segments, front_inner + segments))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_bevel(obj, 0.035)
    cube_project_uv(obj, 2.1)
    return add_export_object(obj, group)


def create_beam_between(
    name: str,
    start: tuple[float, float],
    end: tuple[float, float],
    height: float,
    width: float,
    thickness: float,
    material: bpy.types.Material,
    group: str,
    bevel: float = 0.025,
) -> bpy.types.Object:
    delta_x = end[0] - start[0]
    delta_depth = end[1] - start[1]
    length = math.hypot(delta_x, delta_depth)
    angle = math.atan2(delta_x, delta_depth)
    return create_box(
        name,
        ((start[0] + end[0]) * 0.5, height, (start[1] + end[1]) * 0.5),
        (width, thickness, length),
        material,
        group,
        rotation_y=angle,
        bevel=bevel,
        uv_size=1.5,
    )


def create_under_arch_bay(
    name: str,
    center_x: float,
    top_height: float,
    center_depth: float,
    width: float,
    arch_material: bpy.types.Material,
    void_material: bpy.types.Material,
    gold_material: bpy.types.Material,
    rotation_y: float = 0.0,
    gilded: bool = False,
) -> None:
    outer_radius = width * 0.47
    inner_radius = outer_radius - 0.3
    spring_height = top_height - outer_radius - 0.16
    bottom_height = top_height - 3.45
    leg_height = spring_height - bottom_height
    cosine = math.cos(rotation_y)
    sine = math.sin(rotation_y)

    create_arch_band(
        f"{name}_Arch",
        center_x,
        spring_height,
        center_depth,
        outer_radius,
        inner_radius,
        0.42,
        arch_material,
        "under_arch",
        24,
        rotation_y,
    )

    for side in (-1, 1):
        local_x = side * (outer_radius - 0.18)
        pillar_x = center_x + cosine * local_x
        pillar_depth = center_depth - sine * local_x
        create_box(
            f"{name}_Leg_{side:+d}",
            (pillar_x, bottom_height + leg_height * 0.5, pillar_depth),
            (0.36, leg_height, 0.42),
            arch_material,
            "under_arch",
            rotation_y=rotation_y,
            bevel=0.035,
            uv_size=1.4,
        )
        create_box(
            f"{name}_Foot_{side:+d}",
            (pillar_x, bottom_height + 0.16, pillar_depth),
            (0.58, 0.32, 0.62),
            void_material,
            "foundation",
            rotation_y=rotation_y,
            bevel=0.04,
            uv_size=1.0,
        )

    normal_x = sine * -0.24
    normal_depth = cosine * -0.24
    create_box(
        f"{name}_Void",
        (center_x + normal_x, spring_height - 0.52, center_depth + normal_depth),
        (inner_radius * 1.72, 1.48, 0.07),
        void_material,
        "foundation",
        rotation_y=rotation_y,
        bevel=0.01,
        uv_size=1.0,
    )

    if gilded:
        create_arch_band(
            f"{name}_GoldInlay",
            center_x + sine * 0.235,
            spring_height,
            center_depth + cosine * 0.235,
            inner_radius + 0.075,
            inner_radius + 0.025,
            0.035,
            gold_material,
            "gold",
            28,
            rotation_y,
        )


def create_rubble_cluster(
    name: str,
    center: tuple[float, float, float],
    radius: float,
    pieces: int,
    material: bpy.types.Material,
) -> None:
    center_x, top_height, center_depth = center
    for index in range(pieces):
        angle = math.tau * index / pieces + random.uniform(-0.35, 0.35)
        distance = radius * (0.25 + random.random() * 0.65)
        width = random.uniform(0.22, 0.5)
        depth = random.uniform(0.2, 0.46)
        height = random.uniform(0.12, 0.3)
        create_box(
            f"{name}_Stone_{index:02d}",
            (
                center_x + math.cos(angle) * distance,
                top_height + height * 0.42,
                center_depth + math.sin(angle) * distance,
            ),
            (width, height, depth),
            material,
            "rubble",
            rotation_y=random.uniform(-math.pi, math.pi),
            bevel=0.035,
            uv_size=0.8,
        )


def create_portal_frame(
    x: float,
    ground_height: float,
    depth: float,
    stone_material: bpy.types.Material,
    dark_material: bpy.types.Material,
    gold_material: bpy.types.Material,
) -> None:
    pillar_offset = 1.32
    for side in (-1, 1):
        px = x + side * pillar_offset
        create_box(
            f"Portal_Pillar_{side:+d}",
            (px, ground_height + 1.72, depth),
            (0.62, 3.44, 0.76),
            stone_material,
            "portal_frame",
            bevel=0.07,
            uv_size=1.5,
        )
        create_box(
            f"Portal_PillarBase_{side:+d}",
            (px, ground_height + 0.24, depth),
            (0.98, 0.48, 1.04),
            dark_material,
            "portal_frame",
            bevel=0.065,
        )
        create_cone(
            f"Portal_Spire_{side:+d}",
            (px, ground_height + 4.38, depth),
            0.45,
            0.03,
            1.4,
            dark_material,
            "portal_frame",
            vertices=8,
        )
        create_box(
            f"Portal_GoldInset_{side:+d}",
            (px - side * 0.03, ground_height + 2.05, depth - 0.405),
            (0.12, 2.2, 0.035),
            gold_material,
            "gold",
            bevel=0.01,
            uv_size=0.5,
        )
        create_box(
            f"Portal_Capital_{side:+d}",
            (px, ground_height + 3.32, depth),
            (0.92, 0.24, 1.02),
            dark_material,
            "portal_frame",
            bevel=0.055,
            uv_size=1.1,
        )
        create_box(
            f"Portal_Shoulder_{side:+d}",
            (x + side * 1.84, ground_height + 1.18, depth + 0.04),
            (0.58, 2.36, 0.9),
            dark_material,
            "portal_frame",
            bevel=0.065,
            uv_size=1.3,
        )
        create_cone(
            f"Portal_ShoulderSpire_{side:+d}",
            (x + side * 1.84, ground_height + 2.9, depth + 0.04),
            0.38,
            0.025,
            1.08,
            stone_material,
            "portal_frame",
            vertices=8,
        )

    create_arch_band(
        "Portal_BackArch",
        x,
        ground_height + 3.38,
        depth + 0.08,
        2.02,
        1.72,
        0.92,
        dark_material,
        "portal_frame",
        40,
    )

    create_arch_band(
        "Portal_OuterArch",
        x,
        ground_height + 3.38,
        depth,
        1.64,
        1.07,
        0.78,
        stone_material,
        "portal_frame",
        36,
    )
    create_arch_band(
        "Portal_GoldArch",
        x,
        ground_height + 3.38,
        depth - 0.42,
        1.12,
        1.04,
        0.045,
        gold_material,
        "gold",
        40,
    )
    create_box(
        "Portal_Dais",
        (x, ground_height + 0.13, depth + 0.18),
        (3.55, 0.26, 2.0),
        dark_material,
        "portal_frame",
        bevel=0.11,
    )
    portal_crown = create_torus(
        "Portal_CrownRune",
        (x, ground_height + 5.35, depth + 0.04),
        0.31,
        0.055,
        gold_material,
        "gold",
        32,
    )
    portal_crown.rotation_euler.x = math.pi * 0.5


def create_crystal(
    name: str,
    center: tuple[float, float, float],
    scale: float,
    crystal_material: bpy.types.Material,
    stone_material: bpy.types.Material,
    gold_material: bpy.types.Material,
) -> None:
    x, height, depth = center
    create_cylinder(
        f"{name}_Plinth",
        (x, height + 0.16, depth),
        0.62 * scale,
        0.32 * scale,
        stone_material,
        "stone_detail",
        vertices=8,
        bevel=0.04,
    )
    create_torus(
        f"{name}_GoldRing",
        (x, height + 0.34 * scale, depth),
        0.42 * scale,
        0.035 * scale,
        gold_material,
        "gold",
        32,
    )
    create_cone(
        f"{name}_Core",
        (x, height + 1.05 * scale, depth),
        0.44 * scale,
        0.025,
        1.55 * scale,
        crystal_material,
        "crystal",
        vertices=6,
    )
    shard_specs = [
        (-0.3, 0.12, 0.52, -0.18),
        (0.32, 0.08, 0.46, 0.2),
        (0.1, -0.28, 0.38, -0.12),
    ]
    for index, (offset_x, offset_depth, shard_scale, tilt) in enumerate(shard_specs):
        shard = create_cone(
            f"{name}_Shard_{index:02d}",
            (
                x + offset_x * scale,
                height + 0.58 * scale,
                depth + offset_depth * scale,
            ),
            0.22 * scale,
            0.018,
            shard_scale * 1.5 * scale,
            crystal_material,
            "crystal",
            vertices=6,
        )
        shard.rotation_euler.x = tilt
        shard.rotation_euler.y = -tilt * 0.65


def create_foundation_supports(
    stone_dark: bpy.types.Material,
    stone_mid: bpy.types.Material,
) -> None:
    support_points = [
        (-7.2, 6.6, 0.0),
        (-3.5, 6.4, 0.0),
        (3.4, 6.4, 0.0),
        (7.2, 6.6, 0.0),
        (-6.2, 1.4, 0.0),
        (-1.8, 1.2, 0.0),
        (3.0, 0.8, 0.0),
        (-7.9, -6.5, 0.34),
        (2.2, -7.4, 0.68),
        (7.2, -7.2, 0.68),
        (8.8, 1.8, 0.34),
    ]
    for index, (x, depth, top_height) in enumerate(support_points):
        drop = 3.8 + (index % 3) * 0.6
        create_box(
            f"Foundation_Buttress_{index:02d}",
            (x, top_height - drop * 0.5 - 0.52, depth),
            (1.0 + (index % 2) * 0.22, drop, 1.0),
            stone_mid,
            "foundation",
            bevel=0.07,
            uv_size=2.5,
        )
        create_cone(
            f"Foundation_Spur_{index:02d}",
            (x + ((index % 3) - 1) * 0.18, top_height - drop - 1.15, depth),
            0.56,
            0.08,
            2.3,
            stone_dark,
            "foundation",
            vertices=7,
        )


def create_perimeter_blocks(
    stone_material: bpy.types.Material,
    gold_material: bpy.types.Material,
) -> None:
    block_specs: list[tuple[float, float, float, float]] = []
    for x in (-8.0, -5.8, -3.6, 3.7, 5.9, 8.0):
        block_specs.append((x, 8.75, 0.0, 0.0))
    for x in (1.0, 3.4, 5.8, 8.2):
        block_specs.append((x, -9.3, 0.68, 0.0))
    for depth in (-8.1, -6.3, -4.7):
        block_specs.append((-10.1, depth, 0.34, math.pi * 0.5))
    for depth in (-1.6, 0.8, 3.2):
        block_specs.append((10.25, depth, 0.34, math.pi * 0.5))
    for index, (x, depth, height, rotation) in enumerate(block_specs):
        create_box(
            f"Perimeter_Block_{index:02d}",
            (x, height + 0.24, depth),
            (1.15, 0.48, 0.54),
            stone_material,
            "stone_detail",
            rotation_y=rotation + random.uniform(-0.035, 0.035),
            bevel=0.065,
            uv_size=1.6,
        )
        if index % 2 == 0:
            create_box(
                f"Perimeter_GoldCap_{index:02d}",
                (x, height + 0.5, depth),
                (0.44, 0.055, 0.18),
                gold_material,
                "gold",
                rotation_y=rotation,
                bevel=0.01,
                uv_size=0.5,
            )


def apply_modifiers_and_join() -> None:
    objects_by_group: dict[str, list[bpy.types.Object]] = defaultdict(list)
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH" and obj.get("sanctuary_export"):
            objects_by_group[str(obj.get("export_group", "misc"))].append(obj)

    for group_name, objects in objects_by_group.items():
        for obj in objects:
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            for modifier in list(obj.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)

        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        joined = bpy.context.object
        joined.name = f"Sanctuary_{group_name.title().replace('_', '')}"
        joined["sanctuary_export"] = True
        joined["export_group"] = group_name
        joined.select_set(False)


def build_architecture() -> None:
    floor = make_stone_floor_material()
    stone_light = make_material("M_StoneLight", (0.12, 0.18, 0.27, 1.0), 0.72, 0.03)
    stone_mid = make_material("M_StoneMid", (0.055, 0.095, 0.16, 1.0), 0.82, 0.02)
    stone_dark = make_material("M_StoneDark", (0.018, 0.035, 0.07, 1.0), 0.9, 0.01)
    gold = make_material("M_AgedGold", (0.55, 0.34, 0.12, 1.0), 0.34, 0.72)
    rune = make_material(
        "M_RuneBlue",
        (0.05, 0.5, 0.82, 1.0),
        0.28,
        0.18,
        (0.02, 0.42, 1.0, 1.0),
        3.2,
    )
    crystal = make_material(
        "M_CrystalBlue",
        (0.025, 0.28, 0.82, 1.0),
        0.16,
        0.12,
        (0.01, 0.32, 1.0, 1.0),
        2.8,
    )

    platforms = [
        (
            "PlayerTerrace",
            [(-9.5, 5.25), (-7.9, 4.75), (7.9, 4.75), (9.45, 5.5), (9.0, 9.35), (6.6, 9.9), (-7.7, 9.75), (-10.0, 8.6)],
            0.0,
            1.1,
        ),
        (
            "CentralCourt",
            [(-8.9, 4.85), (-9.7, 2.9), (-9.1, -2.8), (-7.0, -4.8), (-2.0, -5.25), (2.3, -5.0), (5.6, -3.65), (6.8, -0.6), (6.35, 3.25), (4.5, 4.9)],
            0.0,
            1.25,
        ),
        (
            "PortalTerrace",
            [(-10.7, -4.1), (-5.5, -4.3), (-4.8, -6.0), (-5.15, -9.25), (-7.4, -10.0), (-10.9, -8.9), (-11.35, -6.2)],
            0.34,
            1.05,
        ),
        (
            "UpperTerrace",
            [(-0.8, -5.15), (1.1, -4.55), (9.0, -4.6), (10.15, -6.1), (9.75, -9.65), (7.8, -10.2), (0.8, -9.75), (-1.25, -8.25)],
            0.68,
            1.45,
        ),
        (
            "RightIsland",
            [(6.55, -1.1), (10.4, -1.25), (11.15, 0.25), (10.75, 4.35), (8.45, 4.85), (6.7, 3.45)],
            0.34,
            1.0,
        ),
        (
            "LeftFrontIsland",
            [(-10.7, 5.1), (-8.1, 4.85), (-6.8, 6.15), (-7.15, 9.75), (-9.8, 10.1), (-11.25, 8.25)],
            0.0,
            1.0,
        ),
    ]

    for name, footprint, top_height, thickness in platforms:
        create_prism(
            f"{name}_Foundation",
            footprint,
            top_height - 0.12,
            thickness + 0.45,
            stone_mid,
            stone_dark,
            "foundation",
            0.12,
        )
        create_prism(
            f"{name}_Floor",
            footprint,
            top_height,
            0.22,
            floor,
            stone_light,
            "platform",
            0.075,
        )

    create_bridge("Player_Central_Bridge", (-2.2, 5.6), (-1.5, 4.25), 3.25, 0.0, floor, stone_mid, gold)
    create_bridge("Portal_Central_Bridge", (-6.7, -4.4), (-5.15, -3.55), 2.0, 0.34, floor, stone_mid, gold)
    create_bridge("Upper_Central_Bridge", (2.25, -4.3), (3.0, -5.65), 2.35, 0.52, floor, stone_mid, gold)
    create_bridge("Right_Central_Bridge", (5.85, 1.45), (7.25, 1.65), 1.75, 0.27, floor, stone_mid, gold)
    create_bridge("Left_Player_Bridge", (-8.15, 6.9), (-6.85, 6.85), 1.7, 0.0, floor, stone_mid, gold)

    for step in range(4):
        create_box(
            f"Upper_Step_{step}",
            (2.62, 0.09 + step * 0.16, -4.72 - step * 0.31),
            (2.8, 0.18 + step * 0.02, 0.52),
            floor,
            "bridge",
            bevel=0.035,
            uv_size=1.2,
        )

    create_foundation_supports(stone_dark, stone_mid)
    create_perimeter_blocks(stone_light, gold)

    arch_specs = [
        ("CentralFrontA", -6.4, 0.0, 4.72, 2.35, 0.0, True),
        ("CentralFrontB", -3.75, 0.0, 4.78, 2.35, 0.0, False),
        ("CentralFrontC", -1.1, 0.0, 4.82, 2.35, 0.0, True),
        ("CentralFrontD", 1.55, 0.0, 4.84, 2.35, 0.0, False),
        ("CentralLeftA", -9.3, 0.0, 1.55, 2.2, math.pi * 0.5, True),
        ("CentralLeftB", -9.12, 0.0, -1.05, 2.2, math.pi * 0.5, False),
        ("UpperFrontA", 2.0, 0.68, -4.7, 2.35, 0.0, True),
        ("UpperFrontB", 4.7, 0.68, -4.64, 2.35, 0.0, False),
        ("UpperFrontC", 7.4, 0.68, -4.65, 2.35, 0.0, True),
        ("PortalFrontA", -9.25, 0.34, -4.17, 2.15, 0.0, False),
        ("PortalFrontB", -6.75, 0.34, -4.27, 2.15, 0.0, True),
        ("RightIslandFront", 8.85, 0.34, 4.45, 2.25, 0.0, True),
    ]
    for name, x, height, depth, width, rotation, gilded in arch_specs:
        create_under_arch_bay(
            name,
            x,
            height,
            depth,
            width,
            stone_light,
            stone_dark,
            gold,
            rotation,
            gilded,
        )

    edge_specs = [
        ("CentralFront", (-8.55, 4.77), (4.25, 4.88), 0.0),
        ("CentralLeft", (-9.35, 2.7), (-8.95, -2.55), 0.0),
        ("PlayerFront", (-7.65, 9.55), (6.45, 9.72), 0.0),
        ("UpperFront", (1.0, -4.59), (8.8, -4.62), 0.68),
        ("PortalFront", (-10.45, -4.18), (-5.55, -4.35), 0.34),
        ("RightFront", (7.1, 3.6), (10.45, 4.28), 0.34),
    ]
    for name, start, end, height in edge_specs:
        create_beam_between(
            f"{name}_StoneMoulding",
            start,
            end,
            height - 0.08,
            0.24,
            0.18,
            stone_light,
            "edge_moulding",
            0.035,
        )
        create_beam_between(
            f"{name}_GoldFillet",
            start,
            end,
            height + 0.035,
            0.055,
            0.055,
            gold,
            "gold",
            0.01,
        )

    rubble_specs = [
        ("Rubble_CentralLeft", (-6.7, 0.0, 4.15), 0.9, 5),
        ("Rubble_CentralBack", (5.35, 0.0, -3.2), 0.75, 4),
        ("Rubble_PortalBridge", (-5.3, 0.34, -4.5), 0.62, 4),
        ("Rubble_RightIsland", (7.0, 0.34, 3.15), 0.7, 4),
        ("Rubble_UpperEdge", (8.55, 0.68, -5.0), 0.65, 4),
    ]
    for name, center, radius, pieces in rubble_specs:
        create_rubble_cluster(name, center, radius, pieces, stone_light)

    create_portal_frame(-8.25, 0.34, -7.2, stone_light, stone_dark, gold)

    tower_specs = [
        (-3.7, 0.68, -8.65, 4.9, 0.48, False),
        (7.8, 0.68, -8.7, 6.3, 0.62, False),
        (4.6, 0.68, -9.0, 3.8, 0.42, True),
        (-7.9, 0.0, 8.8, 3.4, 0.4, True),
        (9.6, 0.34, 3.25, 3.1, 0.38, False),
    ]
    for index, (x, height, depth, column_height, radius, broken) in enumerate(tower_specs):
        create_column(
            f"SanctuaryColumn_{index:02d}",
            x,
            height,
            depth,
            column_height,
            radius,
            stone_light,
            stone_dark,
            gold,
            broken,
        )

    medallions = [
        (0.7, 0.0, 7.75, 1.25, True),
        (0.0, 0.0, 0.35, 1.55, True),
        (-4.15, 0.0, 0.1, 1.02, False),
        (4.05, 0.0, 0.4, 1.0, False),
        (-8.1, 0.34, -6.2, 1.0, True),
        (4.0, 0.68, -7.35, 1.28, True),
        (8.8, 0.34, 1.75, 1.02, False),
    ]
    for index, (x, height, depth, radius, prominent) in enumerate(medallions):
        create_medallion(f"Medallion_{index:02d}", (x, height, depth), radius, gold, rune, prominent)

    crystals = [
        (-9.35, 0.34, -4.85, 0.82),
        (-9.15, 0.0, 7.9, 1.0),
        (8.85, 0.68, -5.25, 1.08),
        (9.65, 0.34, 3.6, 0.76),
    ]
    for index, (x, height, depth, scale) in enumerate(crystals):
        create_crystal(f"CrystalBeacon_{index:02d}", (x, height, depth), scale, crystal, stone_mid, gold)

    for index, (x, depth, height, rotation) in enumerate(
        [
            (-6.15, 3.75, 0.0, 0.15),
            (-5.4, 3.95, 0.0, -0.2),
            (5.7, -2.95, 0.0, 0.3),
            (6.0, -3.45, 0.0, -0.12),
            (1.0, -5.45, 0.35, 0.0),
        ]
    ):
        create_cone(
            f"BrokenFin_{index:02d}",
            (x, height + 0.72, depth),
            0.3,
            0.035,
            1.45 + index * 0.08,
            stone_light,
            "stone_detail",
            vertices=6,
        ).rotation_euler.z = rotation

    apply_modifiers_and_join()


def look_at(obj: bpy.types.Object, target_world: tuple[float, float, float]) -> None:
    target = Vector(world_to_blender(target_world))
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def configure_preview_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 70
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = scene.world or bpy.data.worlds.new("Sanctuary World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    output = world.node_tree.nodes.new("ShaderNodeOutputWorld")
    background = world.node_tree.nodes.new("ShaderNodeBackground")
    environment = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
    environment.image = bpy.data.images.load(str(SKY_HDR), check_existing=True)
    environment.image.colorspace_settings.name = "Non-Color"
    texture_coordinates = world.node_tree.nodes.new("ShaderNodeTexCoord")
    mapping = world.node_tree.nodes.new("ShaderNodeMapping")
    mapping.inputs["Rotation"].default_value[2] = math.radians(112)
    world.node_tree.links.new(texture_coordinates.outputs["Generated"], mapping.inputs["Vector"])
    world.node_tree.links.new(mapping.outputs["Vector"], environment.inputs["Vector"])
    background.inputs["Strength"].default_value = 0.34
    world.node_tree.links.new(environment.outputs["Color"], background.inputs["Color"])
    world.node_tree.links.new(background.outputs["Background"], output.inputs["Surface"])

    bpy.ops.object.light_add(type="SUN", location=world_to_blender((9.0, 18.0, 4.0)))
    sun = bpy.context.object
    sun.name = "Preview_Sun"
    sun.data.energy = 2.25
    sun.data.color = (1.0, 0.72, 0.48)
    sun.rotation_euler = (math.radians(28), math.radians(-18), math.radians(-38))

    bpy.ops.object.light_add(type="AREA", location=world_to_blender((-7.0, 12.0, 10.0)))
    fill = bpy.context.object
    fill.name = "Preview_SkyFill"
    fill.data.energy = 900
    fill.data.shape = "DISK"
    fill.data.size = 12.0
    fill.data.color = (0.35, 0.58, 1.0)
    look_at(fill, (0.0, 0.0, 0.0))

    bpy.ops.object.camera_add(location=world_to_blender((19.8, 20.8, 30.5)))
    camera = bpy.context.object
    camera.name = "Preview_Camera"
    camera.data.lens = 55
    camera.data.sensor_width = 36
    camera.data.dof.use_dof = False
    look_at(camera, (-0.4, -0.15, -0.6))
    scene.camera = camera


def export_scene() -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.context.scene.render.filepath = str(PREVIEW_PATH)
    bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.get("sanctuary_export"):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(RAW_GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )


def optimize_glb() -> None:
    optimizer = ROOT / "node_modules" / "@gltf-transform" / "cli" / "bin" / "cli.js"
    optimized_path = SCENARIO_DIR / "floating-sanctuary.optimized.glb"
    node_executable = shutil.which("node")

    if not optimizer.exists() or node_executable is None:
        raise RuntimeError("Missing @gltf-transform/cli. Run npm install before exporting the sanctuary.")

    command = [
        node_executable,
        str(optimizer),
        "optimize",
        str(RAW_GLB_PATH),
        str(optimized_path),
        "--compress",
        "meshopt",
        "--texture-compress",
        "webp",
        "--texture-size",
        "1024",
    ]

    subprocess.run(command, check=True, cwd=ROOT)
    optimized_path.replace(GLB_PATH)
    RAW_GLB_PATH.unlink(missing_ok=True)


def main() -> None:
    ensure_directories()
    clear_scene()
    build_architecture()
    configure_preview_scene()
    export_scene()
    optimize_glb()
    print(f"Floating sanctuary exported to {GLB_PATH}")
    print(f"Blender source saved to {BLEND_PATH}")
    print(f"Preview rendered to {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
