#!/usr/bin/env ts-node

import { Project, PropertySignature } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Replaces the .svelte extension with .stories.svelte in a given file path.
 * @param filePath - The original file path.
 * @returns The transformed file path with .stories.svelte extension.
 */
function replaceSvelteWithStories(filePath: string): string {
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath, '.svelte');
    return path.join(dirname, `${basename}.stories.svelte`);
}

function extractPropsFromInterface(filePath: string, interfaceName: string) {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    const interfaceDeclaration = sourceFile.getInterface(interfaceName);
    if (!interfaceDeclaration) {
        console.error(`Interface ${interfaceName} not found in ${filePath}.`);
        return {};
    }

    const props: Record<string, string | number | boolean | string[] | unknown> = {};

    interfaceDeclaration.getProperties().forEach((property: PropertySignature) => {
        const propName = property.getName();
        // const propType = property.getType();
        const [key, value] = property.getText().split(":")

        console.log(`Processing property: ${propName}, type: ${value.trim()}`); // Debug log for type
        const getDefaultValueType = (type: string): string | number | boolean | string[] | unknown => {
            if (type === "string") {
                return "Example Label";
            }
            if (type === "number") {
                return 0;
            }
            if (type === "boolean") {
                return false;
            }

            if (type === "() => void") {
                return "fn()";
            }

            // Check for union types
            const unionTypes = type.split(" | ").map(t => t.trim().replace(/'/g, ""));
            if (unionTypes.length > 1) {
                return unionTypes[0]; // Return the first value as the default
            }

            return "";
        };

        const defaultValue = getDefaultValueType(value.trim());

        props[propName] = defaultValue;
    });


    console.log('Extracted properties:', props); // Debugging final extracted properties
    return props;
}

function writeFileAndFormat(filePath: string, content: string) {
    // Write the content to the file
    fs.writeFileSync(filePath, content, 'utf8');

    // Run Prettier on the file
    try {
        execSync(`npx prettier --write ${filePath}`, { stdio: 'inherit' });
        console.log(`Formatted ${filePath} with Prettier`);
    } catch (error) {
        console.error(`Error formatting ${filePath} with Prettier:`, error);
    }
}

// Main function to generate the Storybook story file
function generateStoryFile(componentName?: string, componentPath?: string, storyTitle?: string, interfaceName?: string) {
    const argz = process.argv.slice(2);

    if (argz.length < 3) {
        console.error('Usage: node xtrax.ts <arg1> <arg2> <arg3>');
        process.exit(1);
    }

    componentName = argz[0];
    componentPath = argz[1] ?? `./${componentName}.svelte`;
    storyTitle = argz[2] ?? `UI/${componentName}`;
    interfaceName = `${componentName ?? ''}Props`;

    // console.log(`Input: ${componentPath} = ${componentName} = ${storyTitle} = ${interfaceName}`)
    const args = extractPropsFromInterface(componentPath, interfaceName);

    if (Object.keys(args).length === 0) {
        console.error('No properties extracted; please check component interface for compatibility.');
        return;
    }

    // Convert args to string, replacing any "fn()" placeholders with actual fn references
    const argsString = JSON.stringify(args, null, 2)
        .replace(/"(\w+)":/g, '$1:')  // Remove quotes around keys
        .replace(/"fn\(\)"/g, 'fn()'); // Replace "fn()" string with fn() function reference

    const storyContent = `
<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import ${componentName} from '${`./${componentName}.svelte`}'
	import { fn } from '@storybook/test'

	const { Story } = defineMeta({
		title: '${storyTitle}',
		component: ${componentName},
		tags: ['autodocs'],
		args: ${argsString},
	})
</script>

<Story name="Default" args={{ ${Object.keys(args)
            .map((key) => `${key}: ${args[key] == "fn()" ? args[key] : JSON.stringify(args[key])}`)
            .join(', ')} }} />
`;

    // Define the output path for the story file
    // const storyFilePath = path.join(__dirname, `${componentName}.stories.svelte`);
    const storyFilePath = path.join(__dirname, `${replaceSvelteWithStories(componentPath)}`);
    // Write the file to the file system
    writeFileAndFormat(storyFilePath, storyContent);

    console.log(`Story file generated at ${storyFilePath}`);
}

// Usage
generateStoryFile();