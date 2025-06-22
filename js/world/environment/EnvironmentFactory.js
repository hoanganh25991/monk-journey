import * as THREE from 'three';

// Import environment configuration
import { ENVIRONMENT_OBJECTS } from '../../config/environment.js';

// Import environment objects
import { WaterFeature } from './WaterFeature.js';
import { LavaFeature } from './LavaFeature.js';
import { CrystalFormation } from './CrystalFormation.js';
import { RarePlant } from './RarePlant.js';
import { MagicalStone } from './MagicalStone.js';
import { AncientArtifact } from './AncientArtifact.js';
import { Moss } from './Moss.js';
import { Oasis } from './Oasis.js';
import { ObsidianFormation } from './ObsidianFormation.js';
import { DesertShrine } from './DesertShrine.js';
import { TreeCluster } from './TreeCluster.js';
import { SmallPeak } from './SmallPeak.js';
import { SnowPatch } from './SnowPatch.js';
import { ForestDebris } from './ForestDebris.js';

// Import traditional environment objects
import { Tree } from './Tree.js';
import { TreeWithLOD } from './TreeWithLOD.js';
import { Rock } from './Rock.js';
import { Bush } from './Bush.js';
import { Flower } from './Flower.js';
import { TallGrass } from './TallGrass.js';
import { AncientTree } from './AncientTree.js';
import { Waterfall } from './Waterfall.js';
import { SmallMushroom } from './SmallMushroom.js';
import { ForestFlower } from './ForestFlower.js';
import { Fern } from './Fern.js';
import { BerryBush } from './BerryBush.js';

// Import village and urban environment objects
import { Market } from './Market.js';
import { Square } from './Square.js';
import { Plaza } from './Plaza.js';
import { Stairs } from './Stairs.js';
import { Well } from './Well.js';
import { Statue } from './Statue.js';
import { Fountain } from './Fountain.js';

// Import newly added environment objects
import { OvergrownRuin } from './OvergrownRuin.js';
import { StatueFragment } from './StatueFragment.js';
import { BrokenColumn } from './BrokenColumn.js';
import { RuneStone } from './RuneStone.js';
import { AncientStone } from './AncientStone.js';
import { GlowingMushroom } from './GlowingMushroom.js';
import { SwampTree } from './SwampTree.js';
import { LilyPad } from './LilyPad.js';
import { SwampDebris } from './SwampDebris.js';
import { SwampPlant } from './SwampPlant.js';
import { MysteriousPortal } from './MysteriousPortal.js';
import { SwampLight } from './SwampLight.js';

// Import missing environment objects
import { AshPile } from './AshPile.js';
import { DesertPlant } from './DesertPlant.js';
import { LavaRock } from './LavaRock.js';
import { EmberVent } from './EmberVent.js';
import { Obsidian } from './Obsidian.js';
import { PineTree } from './PineTree.js';
import { MountainRock } from './MountainRock.js';
import { IceShard } from './IceShard.js';
import { AlpineFlower } from './AlpineFlower.js';
import { FairyCircle } from './FairyCircle.js';
import { GlowingFlowers } from './GlowingFlowers.js';
import { MushroomCluster } from './MushroomCluster.js';
import { Treehouse } from './Treehouse.js';
import { BogPit } from './BogPit.js';
import { ForestShrine } from './ForestShrine.js';
import { IceFormation } from './IceFormation.js';

// Import newly added missing environment objects
import { CrystalOutcrop } from './CrystalOutcrop.js';
import { MountainCave } from './MountainCave.js';
import { GiantMushroom } from './GiantMushroom.js';
import { MagicCircle } from './MagicCircle.js';

// Import newly created dedicated classes
import { MagicalFlower } from './MagicalFlower.js';
import { SmallCrystal } from './SmallCrystal.js';
import { StoneCircle } from './StoneCircle.js';
import { MountainPass } from './MountainPass.js';
import { Shrine } from './Shrine.js';
import { Stump } from './Stump.js';
import { RockFormation } from './RockFormation.js';
import { Mushroom } from './Mushroom.js';
import { FallenLog } from './FallenLog.js';
import { SmallPlant } from './SmallPlant.js';
import { AncientAltar } from './AncientAltar.js';
import { ForgottenStatue } from './ForgottenStatue.js';

/**
 * Environment Factory - Creates environment objects based on type
 * Centralizes environment object creation and provides a registry for all types
 */
export class EnvironmentFactory {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.registry = new Map();
        
        // Register all environment object creators
        this.registerEnvironmentObjects();
    }
    
    /**
     * Register all environment object creators
     */
    registerEnvironmentObjects() {
        // Register environment objects with dedicated classes
        this.register(ENVIRONMENT_OBJECTS.WATER, (position, size) => {
            const waterFeature = new WaterFeature(this.scene, this.worldManager, position, size);
            return waterFeature.object;
        });
        this.register(ENVIRONMENT_OBJECTS.LAVA, (position, size) => {
            const lavaFeature = new LavaFeature(this.scene, this.worldManager, position, size);
            return lavaFeature.object;
        });
        this.register(ENVIRONMENT_OBJECTS.CRYSTAL_FORMATION, (position, size) => {
            const crystalFormation = new CrystalFormation(this.scene, this.worldManager, position, size);
            return crystalFormation.object;
        });
        this.register(ENVIRONMENT_OBJECTS.RARE_PLANT, (position, size) => {
            const rarePlant = new RarePlant(this.scene, this.worldManager, position, size);
            return rarePlant.object;
        });
        this.register(ENVIRONMENT_OBJECTS.MAGICAL_STONE, (position, size) => {
            const magicalStone = new MagicalStone(this.scene, this.worldManager, position, size);
            return magicalStone.object;
        });
        this.register(ENVIRONMENT_OBJECTS.ANCIENT_ARTIFACT, (position, size) => {
            const ancientArtifact = new AncientArtifact(this.scene, this.worldManager, position, size);
            return ancientArtifact.object;
        });
        this.register(ENVIRONMENT_OBJECTS.MOSS, (position, size) => {
            const moss = new Moss(this.scene, this.worldManager, position, size);
            return moss.object;
        });
        this.register(ENVIRONMENT_OBJECTS.OASIS, (position, size) => {
            const oasis = new Oasis(this.scene, this.worldManager, position, size);
            return oasis.object;
        });
        this.register(ENVIRONMENT_OBJECTS.OBSIDIAN_FORMATION, (position, size) => {
            const obsidianFormation = new ObsidianFormation(this.scene, this.worldManager, position, size);
            return obsidianFormation.object;
        });
        this.register(ENVIRONMENT_OBJECTS.DESERT_SHRINE, (position, size) => {
            const desertShrine = new DesertShrine(this.scene, this.worldManager, position, size);
            return desertShrine.object;
        });
        this.register(ENVIRONMENT_OBJECTS.TREE_CLUSTER, (data) => {
            const treeCluster = new TreeCluster(this.scene, this.worldManager, data);
            return treeCluster.group;
        });
        this.register(ENVIRONMENT_OBJECTS.SMALL_PEAK, (position, size) => {
            const smallPeak = new SmallPeak(this.scene, this.worldManager, position, size);
            return smallPeak.object;
        });
        this.register(ENVIRONMENT_OBJECTS.SNOW_PATCH, (position, size) => {
            const snowPatch = new SnowPatch(this.scene, this.worldManager, position, size);
            return snowPatch.object;
        });
        
        // Register village and urban environment objects
        this.register(ENVIRONMENT_OBJECTS.MARKET, (position, size, data) => {
            const market = new Market(this.scene, this.worldManager);
            return market.createMesh({ position, size, ...data });
        });
        this.register(ENVIRONMENT_OBJECTS.SQUARE, (position, size, data) => {
            const square = new Square(this.scene, this.worldManager);
            return square.createMesh({ position, size, ...data });
        });
        this.register(ENVIRONMENT_OBJECTS.PLAZA, (position, size, data) => {
            const plaza = new Plaza(this.scene, this.worldManager);
            return plaza.createMesh({ position, size, ...data });
        });
        this.register(ENVIRONMENT_OBJECTS.STAIRS, (position, size, data) => {
            const stairs = new Stairs(this.scene, this.worldManager);
            return stairs.createMesh({ position, size, ...data });
        });
        
        this.register(ENVIRONMENT_OBJECTS.WELL, (position, size, data) => {
            const well = new Well(this.scene, this.worldManager);
            return well.createMesh({ position, size, ...data });
        });
        
        this.register(ENVIRONMENT_OBJECTS.STATUE, (position, size, data) => {
            const statue = new Statue(this.scene, this.worldManager);
            return statue.createMesh({ position, size, ...data });
        });
        
        this.register(ENVIRONMENT_OBJECTS.FOUNTAIN, (position, size, data) => {
            const fountain = new Fountain(this.scene, this.worldManager);
            return fountain.createMesh({ position, size, ...data });
        });
        
        // Register traditional environment objects
        this.register(ENVIRONMENT_OBJECTS.TREE, (position, size) => {
            // Use TreeWithLOD instead of Tree to maintain consistent appearance
            const tree = new TreeWithLOD();
            const treeGroup = tree.createMesh();
            treeGroup.position.copy(position);
            if (size !== 1) {
                treeGroup.scale.set(size, size, size);
            }
            this.scene.add(treeGroup);
            return treeGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ROCK, (position, size) => {
            const rock = new Rock();
            const rockGroup = rock.createMesh();
            rockGroup.position.copy(position);
            if (size !== 1) {
                rockGroup.scale.set(size, size, size);
            }
            this.scene.add(rockGroup);
            return rockGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.BUSH, (position, size) => {
            const bush = new Bush();
            const bushGroup = bush.createMesh();
            bushGroup.position.copy(position);
            if (size !== 1) {
                bushGroup.scale.set(size, size, size);
            }
            this.scene.add(bushGroup);
            return bushGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.FLOWER, (position, size) => {
            const flower = new Flower();
            const flowerGroup = flower.createMesh();
            flowerGroup.position.copy(position);
            if (size !== 1) {
                flowerGroup.scale.set(size, size, size);
            }
            this.scene.add(flowerGroup);
            return flowerGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.TALL_GRASS, (position, size) => {
            // Get zone type from world manager if available
            let zoneType = 'Forest'; // Default
            if (this.worldManager && this.worldManager.getZoneAt) {
                const zone = this.worldManager.getZoneAt(position);
                if (zone && zone.type) {
                    zoneType = zone.type;
                }
            }
            
            const tallGrass = new TallGrass(zoneType);
            const grassGroup = tallGrass.createMesh();
            grassGroup.position.copy(position);
            if (size !== 1) {
                grassGroup.scale.set(size, size, size);
            }
            this.scene.add(grassGroup);
            return grassGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ANCIENT_TREE, (position, size) => {
            const ancientTree = new AncientTree();
            const treeGroup = ancientTree.createMesh();
            treeGroup.position.copy(position);
            if (size !== 1) {
                treeGroup.scale.set(size, size, size);
            }
            this.scene.add(treeGroup);
            return treeGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.WATERFALL, (position, size) => {
            const waterfall = new Waterfall(this.scene, this.worldManager);
            const waterfallGroup = waterfall.createMesh(position);
            if (size !== 1) {
                waterfallGroup.scale.set(size, size, size);
            }
            return waterfallGroup;
        });
        
        // Register our new dedicated objects
        this.register(ENVIRONMENT_OBJECTS.SMALL_MUSHROOM, (position, size, data = {}) => {
            const smallMushroom = new SmallMushroom(this.scene, this.worldManager);
            const mushroomGroup = smallMushroom.createMesh(position, size, data);
            return mushroomGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.FOREST_FLOWER, (position, size, data = {}) => {
            const forestFlower = new ForestFlower(this.scene, this.worldManager);
            const flowerGroup = forestFlower.createMesh(position, size, data);
            return flowerGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.FOREST_DEBRIS, (position, size, data = {}) => {
            const forestDebris = new ForestDebris(this.scene, this.worldManager);
            const debrisGroup = forestDebris.createMesh(position, size, data);
            return debrisGroup;
        });
        
        // Register new forest environment objects
        this.register(ENVIRONMENT_OBJECTS.FERN, (position, size, data = {}) => {
            const fern = new Fern(this.scene, this.worldManager);
            const fernGroup = fern.createMesh(position, size, data);
            return fernGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.BERRY_BUSH, (position, size, data = {}) => {
            const berryBush = new BerryBush(this.scene, this.worldManager);
            const bushGroup = berryBush.createMesh(position, size, data);
            return bushGroup;
        });
        
        // Register newly added environment objects
        this.register(ENVIRONMENT_OBJECTS.OVERGROWN_RUIN, (position, size, data = {}) => {
            const overgrownRuin = new OvergrownRuin(this.scene, this.worldManager);
            const ruinGroup = overgrownRuin.createMesh(position, size, data);
            return ruinGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.STATUE_FRAGMENT, (position, size, data = {}) => {
            const statueFragment = new StatueFragment(this.scene, this.worldManager);
            const fragmentGroup = statueFragment.createMesh(position, size, data);
            return fragmentGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.BROKEN_COLUMN, (position, size, data = {}) => {
            const brokenColumn = new BrokenColumn(this.scene, this.worldManager);
            const columnGroup = brokenColumn.createMesh(position, size, data);
            return columnGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.RUNE_STONE, (position, size, data = {}) => {
            const runeStone = new RuneStone(this.scene, this.worldManager);
            const stoneGroup = runeStone.createMesh(position, size, data);
            return stoneGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ANCIENT_STONE, (position, size, data = {}) => {
            const ancientStone = new AncientStone(this.scene, this.worldManager);
            const stoneGroup = ancientStone.createMesh(position, size, data);
            return stoneGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.GLOWING_MUSHROOM, (position, size, data = {}) => {
            const glowingMushroom = new GlowingMushroom(this.scene, this.worldManager);
            const mushroomGroup = glowingMushroom.createMesh(position, size, data);
            return mushroomGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.SWAMP_TREE, (position, size, data = {}) => {
            const swampTree = new SwampTree(this.scene, this.worldManager);
            const treeGroup = swampTree.createMesh(position, size, data);
            return treeGroup;
        });
        
        // Register the mysterious portal
        this.register(ENVIRONMENT_OBJECTS.MYSTERIOUS_PORTAL, (position, size, data = {}) => {
            const mysteriousPortal = new MysteriousPortal(this.scene, this.worldManager);
            const portalGroup = mysteriousPortal.createMesh(position, size, data);
            return portalGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.LILY_PAD, (position, size, data = {}) => {
            const lilyPad = new LilyPad(this.scene, this.worldManager);
            const padGroup = lilyPad.createMesh(position, size, data);
            return padGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.SWAMP_DEBRIS, (position, size, data = {}) => {
            const swampDebris = new SwampDebris(this.scene, this.worldManager);
            const debrisGroup = swampDebris.createMesh(position, size, data);
            return debrisGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.SWAMP_PLANT, (position, size, data = {}) => {
            const swampPlant = new SwampPlant(this.scene, this.worldManager);
            const plantGroup = swampPlant.createMesh(position, size, data);
            return plantGroup;
        });
        
        // Register small plant with dedicated class
        this.register(ENVIRONMENT_OBJECTS.SMALL_PLANT, (position, size, data = {}) => {
            const smallPlant = new SmallPlant(this.scene, this.worldManager);
            const plantGroup = smallPlant.createMesh(position, size, data);
            return plantGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.FALLEN_LOG, (position, size, data = {}) => {
            const fallenLog = new FallenLog(this.scene, this.worldManager);
            const logGroup = fallenLog.createMesh(position, size, data);
            return logGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.MUSHROOM, (position, size, data = {}) => {
            const mushroom = new Mushroom(this.scene, this.worldManager);
            const mushroomGroup = mushroom.createMesh(position, size, data);
            return mushroomGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ROCK_FORMATION, (position, size, data = {}) => {
            const rockFormation = new RockFormation(this.scene, this.worldManager);
            const rockFormationGroup = rockFormation.createMesh(position, size, data);
            return rockFormationGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.SHRINE, (position, size, data = {}) => {
            const shrine = new Shrine(this.scene, this.worldManager);
            const shrineGroup = shrine.createMesh(position, size, data);
            return shrineGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.STUMP, (position, size, data = {}) => {
            const stump = new Stump(this.scene, this.worldManager);
            const stumpGroup = stump.createMesh(position, size, data);
            return stumpGroup;
        });
        
        // Register missing environment objects
        this.register(ENVIRONMENT_OBJECTS.ASH_PILE, (position, size, data = {}) => {
            const ashPile = new AshPile(this.scene, this.worldManager);
            const ashGroup = ashPile.createMesh(position, size, data);
            return ashGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.DESERT_PLANT, (position, size, data = {}) => {
            const desertPlant = new DesertPlant(this.scene, this.worldManager);
            const plantGroup = desertPlant.createMesh(position, size, data);
            return plantGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.LAVA_ROCK, (position, size, data = {}) => {
            const lavaRock = new LavaRock(this.scene, this.worldManager);
            const rockGroup = lavaRock.createMesh(position, size, data);
            return rockGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.EMBER_VENT, (position, size, data = {}) => {
            const emberVent = new EmberVent(this.scene, this.worldManager);
            const ventGroup = emberVent.createMesh(position, size, data);
            return ventGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.OBSIDIAN, (position, size, data = {}) => {
            const obsidian = new Obsidian(this.scene, this.worldManager);
            const obsidianGroup = obsidian.createMesh(position, size, data);
            return obsidianGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.PINE_TREE, (position, size, data = {}) => {
            const pineTree = new PineTree(this.scene, this.worldManager);
            const treeGroup = pineTree.createMesh(position, size, data);
            return treeGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.MOUNTAIN_ROCK, (position, size, data = {}) => {
            const mountainRock = new MountainRock(this.scene, this.worldManager);
            const rockGroup = mountainRock.createMesh(position, size, data);
            return rockGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ICE_SHARD, (position, size, data = {}) => {
            const iceShard = new IceShard(this.scene, this.worldManager);
            const shardGroup = iceShard.createMesh(position, size, data);
            return shardGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.ALPINE_FLOWER, (position, size, data = {}) => {
            const alpineFlower = new AlpineFlower(this.scene, this.worldManager);
            const flowerGroup = alpineFlower.createMesh(position, size, data);
            return flowerGroup;
        });
        
        // Register fairy circle environment object
        this.register(ENVIRONMENT_OBJECTS.FAIRY_CIRCLE, (position, size, data = {}) => {
            const fairyCircle = new FairyCircle(this.scene, this.worldManager);
            const circleGroup = fairyCircle.createMesh(position, size, data);
            return circleGroup;
        });
        
        // Register glowing flowers environment object
        this.register(ENVIRONMENT_OBJECTS.GLOWING_FLOWERS, (position, size, data = {}) => {
            const glowingFlowers = new GlowingFlowers(this.scene, this.worldManager);
            const flowersGroup = glowingFlowers.createMesh(position, size, data);
            return flowersGroup;
        });
        
        // Register mushroom cluster environment object
        this.register(ENVIRONMENT_OBJECTS.MUSHROOM_CLUSTER, (position, size, data = {}) => {
            const mushroomCluster = new MushroomCluster(this.scene, this.worldManager);
            const clusterGroup = mushroomCluster.createMesh(position, size, data);
            return clusterGroup;
        });
        
        // Register treehouse environment object
        this.register(ENVIRONMENT_OBJECTS.TREEHOUSE, (position, size, data = {}) => {
            const treehouse = new Treehouse(this.scene, this.worldManager);
            const treehouseGroup = treehouse.createMesh(position, size, data);
            return treehouseGroup;
        });
        
        // Register bog pit environment object
        this.register(ENVIRONMENT_OBJECTS.BOG_PIT, (position, size, data = {}) => {
            const bogPit = new BogPit(this.scene, this.worldManager, position, size);
            return bogPit.object;
        });
        
        // Register forest shrine environment object
        this.register(ENVIRONMENT_OBJECTS.FOREST_SHRINE, (position, size, data = {}) => {
            const forestShrine = new ForestShrine(this.scene, this.worldManager, position, size);
            return forestShrine.object;
        });
        
        // Register ice formation environment object
        this.register(ENVIRONMENT_OBJECTS.ICE_FORMATION, (position, size, data = {}) => {
            const iceFormation = new IceFormation(this.scene, this.worldManager, position, size);
            return iceFormation.object;
        });
        
        // Register crystal outcrop environment object
        this.register(ENVIRONMENT_OBJECTS.CRYSTAL_OUTCROP, (position, size, data = {}) => {
            const crystalOutcrop = new CrystalOutcrop(this.scene, this.worldManager, position, size, data);
            return crystalOutcrop.createMesh();
        });
        
        // Register mountain cave environment object
        this.register(ENVIRONMENT_OBJECTS.MOUNTAIN_CAVE, (position, size, data = {}) => {
            const mountainCave = new MountainCave(this.scene, this.worldManager, position, size, data);
            return mountainCave.createMesh();
        });
        
        // Register giant mushroom environment object
        this.register(ENVIRONMENT_OBJECTS.GIANT_MUSHROOM, (position, size, data = {}) => {
            const giantMushroom = new GiantMushroom(this.scene, this.worldManager, position, size, data);
            return giantMushroom.createMesh();
        });
        
        // Register magic circle environment object
        this.register(ENVIRONMENT_OBJECTS.MAGIC_CIRCLE, (position, size, data = {}) => {
            const magicCircle = new MagicCircle(this.scene, this.worldManager, position, size, data);
            return magicCircle.createMesh();
        });
        
        // Register swamp light environment object
        this.register(ENVIRONMENT_OBJECTS.SWAMP_LIGHT, (position, size, data = {}) => {
            const swampLight = new SwampLight(this.scene, this.worldManager, position, size, data);
            return swampLight.object;
        });
        
        // Register missing environment objects that appear in map files
        this.register(ENVIRONMENT_OBJECTS.SMALL_CRYSTAL, (position, size) => {
            // Create a small crystal formation using a scaled-down crystal
            const geometry = new THREE.OctahedronGeometry(0.3 * size, 0);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.8,
                emissive: 0x004444
            });
            const crystal = new THREE.Mesh(geometry, material);
            
            // Position on terrain
            crystal.position.copy(position);
            crystal.position.y += 0.15 * size; // Raise slightly above ground
            
            // Random rotation
            crystal.rotation.x = Math.random() * Math.PI;
            crystal.rotation.y = Math.random() * Math.PI * 2;
            crystal.rotation.z = Math.random() * Math.PI;
            
            // Add to scene
            this.scene.add(crystal);
            
            return crystal;
        });
        
        this.register(ENVIRONMENT_OBJECTS.MAGICAL_FLOWER, (position, size) => {
            // Create a magical flower with glowing effect
            const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.4 * size, 8);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            // Create petals
            const petalGeometry = new THREE.SphereGeometry(0.1 * size, 8, 6);
            const petalMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFF69B4,
                emissive: 0x441144,
                transparent: true,
                opacity: 0.9
            });
            
            const flowerGroup = new THREE.Group();
            flowerGroup.add(stem);
            
            // Add 5 petals in a circle
            for (let i = 0; i < 5; i++) {
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                const angle = (i / 5) * Math.PI * 2;
                petal.position.x = Math.cos(angle) * 0.08 * size;
                petal.position.y = 0.2 * size;
                petal.position.z = Math.sin(angle) * 0.08 * size;
                flowerGroup.add(petal);
            }
            
            // Add center
            const centerGeometry = new THREE.SphereGeometry(0.03 * size, 8, 6);
            const centerMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFF00,
                emissive: 0x444400
            });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.2 * size;
            flowerGroup.add(center);
            
            // Position on terrain
            flowerGroup.position.copy(position);
            
            // Add to scene
            this.scene.add(flowerGroup);
            
            return flowerGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.STONE_CIRCLE, (position, size) => {
            // Create a circle of standing stones
            const stoneCircleGroup = new THREE.Group();
            const numStones = 6;
            const radius = 2 * size;
            
            for (let i = 0; i < numStones; i++) {
                const angle = (i / numStones) * Math.PI * 2;
                const stoneGeometry = new THREE.BoxGeometry(
                    0.3 * size, 
                    (1.2 + Math.random() * 0.6) * size, 
                    0.2 * size
                );
                const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x616161 });
                const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                
                stone.position.x = Math.cos(angle) * radius;
                stone.position.y = 0.6 * size;
                stone.position.z = Math.sin(angle) * radius;
                
                // Slight random rotation
                stone.rotation.y = angle + (Math.random() - 0.5) * 0.3;
                
                stoneCircleGroup.add(stone);
            }
            
            // Position on terrain
            stoneCircleGroup.position.copy(position);
            
            // Add to scene
            this.scene.add(stoneCircleGroup);
            
            return stoneCircleGroup;
        });
        
        this.register(ENVIRONMENT_OBJECTS.MOUNTAIN_PASS, (position, size) => {
            // Create a mountain pass with rocky walls
            const passGroup = new THREE.Group();
            
            // Create rocky walls on both sides
            for (let side = 0; side < 2; side++) {
                const wallGroup = new THREE.Group();
                const sideMultiplier = side === 0 ? -1 : 1;
                
                // Create multiple rocks for each wall
                for (let i = 0; i < 3; i++) {
                    const rockGeometry = new THREE.BoxGeometry(
                        (1 + Math.random() * 0.5) * size,
                        (2 + Math.random() * 1) * size,
                        (0.8 + Math.random() * 0.4) * size
                    );
                    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
                    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                    
                    rock.position.x = sideMultiplier * (2 + Math.random() * 1) * size;
                    rock.position.y = 1 * size;
                    rock.position.z = (i - 1) * 1.5 * size;
                    
                    // Random rotation
                    rock.rotation.y = (Math.random() - 0.5) * 0.5;
                    
                    wallGroup.add(rock);
                }
                
                passGroup.add(wallGroup);
            }
            
            // Position on terrain
            passGroup.position.copy(position);
            
            // Add to scene
            this.scene.add(passGroup);
            
            return passGroup;
        });
        
        // Register Ancient Altar
        this.register(ENVIRONMENT_OBJECTS.ANCIENT_ALTAR, (position, size) => {
            const ancientAltar = new AncientAltar(this.scene, this.worldManager, position, size);
            return ancientAltar.object;
        });
        
        // Register Forgotten Statue
        this.register(ENVIRONMENT_OBJECTS.FORGOTTEN_STATUE, (position, size) => {
            const forgottenStatue = new ForgottenStatue(this.scene, this.worldManager, position, size);
            return forgottenStatue.object;
        });
    }
    
    /**
     * Register an environment object creator
     * @param {string} type - The type of environment object
     * @param {Function} creator - The creator function
     */
    register(type, creator) {
        this.registry.set(type, creator);
    }
    
    /**
     * Create an environment object
     * @param {string} type - The type of environment object to create
     * @param {THREE.Vector3} position - Position vector with x, y, z coordinates
     * @param {number} size - Size of the object
     * @param {Object} data - Additional data for complex objects
     * @returns {THREE.Object3D} - The created environment object
     */
    create(type, position, size, data = null) {
        const creator = this.registry.get(type);
        
        if (!creator) {
            console.warn(`Unknown environment object type: ${type}`);
            return null;
        }
        
        // Ensure position is a valid Vector3
        if (!(position instanceof THREE.Vector3)) {
            console.warn(`Invalid position for environment object ${type}. Using default position.`);
            position = new THREE.Vector3(0, 0, 0);
        }
        
        try {
            // For objects that need the full data object (like tree_cluster)
            if (type === 'tree_cluster') {
                // Make sure we have a valid data object with position
                const treeClusterData = data || {};
                
                // If no positions array is provided, create one with the current position
                if (!treeClusterData.positions || !Array.isArray(treeClusterData.positions)) {
                    treeClusterData.positions = [{ 
                        x: position.x, 
                        y: position.y, 
                        z: position.z 
                    }];
                }
                
                // Ensure the center position is set
                treeClusterData.centerPosition = treeClusterData.centerPosition || {
                    x: position.x,
                    y: position.y,
                    z: position.z
                };
                
                return creator(treeClusterData);
            }
            
            // For objects that need data parameter
            if (type.includes('flower') || type.includes('mushroom') || 
                type.includes('plant') || type.includes('tree') || 
                type.includes('formation') || type.includes('stone') || 
                type.includes('shrine') || type.includes('ruin') || 
                type === 'moss') {
                return creator(position, size, data || {});
            }
            
            // For standard objects that just need position and size
            return creator(position, size);
        } catch (error) {
            console.error(`Error creating environment object of type ${type}:`, error);
            return null;
        }
    }
    
    /**
     * Check if an environment object type is registered
     * @param {string} type - The type to check
     * @returns {boolean} - True if the type is registered
     */
    hasType(type) {
        return this.registry.has(type);
    }
    
    /**
     * Check if the factory can create an environment object of the given type
     * @param {string} type - The type to check
     * @returns {boolean} - True if the factory can create the type
     */
    canCreate(type) {
        return this.registry.has(type);
    }
    
    /**
     * Check if the factory has a specific type registered
     * @param {string} type - The type to check
     * @returns {boolean} - True if the type is registered
     */
    has(type) {
        return this.registry.has(type);
    }
    
    /**
     * Get all registered environment object types
     * @returns {Array<string>} - Array of registered types
     */
    getRegisteredTypes() {
        return Array.from(this.registry.keys());
    }
}