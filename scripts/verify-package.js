const fs = require('fs');
const path = require('path');
const projectManifest = require('../package.json');

const sharpVersion = projectManifest.dependencies.sharp;

const EXPECTED_VERSIONS = {
  '@huggingface/transformers': projectManifest.dependencies['@huggingface/transformers'],
  '@img/sharp-win32-x64': sharpVersion,
  onnxruntimeNode: projectManifest.dependencies['onnxruntime-node'],
  sharp: sharpVersion
};

const REQUIRED_MODEL_FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx'
];

const MIN_ONNX_FILE_SIZE = 1024 * 1024;

function isDirectory(target) {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function assertFile(filePath, label, failures, minimumSize = 1) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size < minimumSize) {
      failures.push(`${label} is empty or invalid: ${filePath}`);
    }
  } catch {
    failures.push(`${label} is missing: ${filePath}`);
  }
}

function discoverPackages(searchRoots) {
  const packages = new Map();
  const pending = [...searchRoots];
  const visited = new Set();

  while (pending.length > 0) {
    const current = pending.pop();
    let realPath;
    try {
      realPath = fs.realpathSync(current);
    } catch {
      continue;
    }
    if (visited.has(realPath)) continue;
    visited.add(realPath);

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    const packageJson = entries.find((entry) => entry.isFile() && entry.name === 'package.json');
    if (packageJson) {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(current, packageJson.name), 'utf8'));
        if (typeof manifest.name === 'string' && !packages.has(manifest.name)) {
          packages.set(manifest.name, { directory: current, manifest });
        }
      } catch {
        // A malformed package is reported later if it is one of the required packages.
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        pending.push(path.join(current, entry.name));
      }
    }
  }

  return packages;
}

function verifyPackageVersion(packages, packageName, expectedVersion, failures) {
  const found = packages.get(packageName);
  if (!found) {
    failures.push(`Required package is missing from app.asar.unpacked: ${packageName}`);
    return null;
  }
  if (found.manifest.version !== expectedVersion) {
    failures.push(
      `${packageName} version is ${found.manifest.version || 'unknown'}, expected ${expectedVersion}`
    );
  }
  return found.directory;
}

function verifyWindowsNativeModules(resourcesDir, failures) {
  const moduleRoots = [
    path.join(resourcesDir, 'app.asar.unpacked', 'node_modules'),
    path.join(resourcesDir, 'app', 'node_modules')
  ].filter(isDirectory);

  if (moduleRoots.length === 0) {
    failures.push('No unpacked node_modules directory was found in the Windows artifact');
    return;
  }

  const packages = discoverPackages(moduleRoots);
  verifyPackageVersion(
    packages,
    '@huggingface/transformers',
    EXPECTED_VERSIONS['@huggingface/transformers'],
    failures
  );
  verifyPackageVersion(packages, 'sharp', EXPECTED_VERSIONS.sharp, failures);

  const sharpNativeDir = verifyPackageVersion(
    packages,
    '@img/sharp-win32-x64',
    EXPECTED_VERSIONS['@img/sharp-win32-x64'],
    failures
  );
  if (sharpNativeDir) {
    assertFile(
      path.join(sharpNativeDir, 'lib', `sharp-win32-x64-${sharpVersion}.node`),
      'Windows Sharp native binding',
      failures
    );
    assertFile(
      path.join(sharpNativeDir, 'lib', 'libvips-42.dll'),
      'Windows libvips runtime',
      failures
    );
    const libDir = path.join(sharpNativeDir, 'lib');
    const hasCppRuntime = isDirectory(libDir) && fs.readdirSync(libDir).some((name) => /^libvips-cpp-.*\.dll$/i.test(name));
    if (!hasCppRuntime) failures.push(`Windows libvips C++ runtime is missing from ${libDir}`);
  }

  const onnxDir = verifyPackageVersion(
    packages,
    'onnxruntime-node',
    EXPECTED_VERSIONS.onnxruntimeNode,
    failures
  );
  if (onnxDir) {
    const runtimeDir = path.join(onnxDir, 'bin', 'napi-v6', 'win32', 'x64');
    for (const fileName of [
      'onnxruntime_binding.node',
      'onnxruntime.dll',
      'DirectML.dll',
      'dxcompiler.dll',
      'dxil.dll'
    ]) {
      assertFile(path.join(runtimeDir, fileName), `ONNX Runtime ${fileName}`, failures);
    }
  }
}

function validateBundledModel(modelDir, modelId, failures) {
  for (const relativePath of REQUIRED_MODEL_FILES) {
    const filePath = path.join(modelDir, ...relativePath.split('/'));
    const minimumSize = relativePath.endsWith('.onnx') ? MIN_ONNX_FILE_SIZE : 1;
    assertFile(filePath, `${modelId} ${relativePath}`, failures, minimumSize);
    if (!relativePath.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        failures.push(`${modelId} ${relativePath} is not a JSON object`);
      } else if (relativePath === 'config.json' && parsed.model_type !== 'whisper') {
        failures.push(`${modelId} config.json is not a Whisper model config`);
      }
    } catch {
      failures.push(`${modelId} ${relativePath} is not valid JSON`);
    }
  }
}

function verifyBundledModels(resourcesDir, failures) {
  const modelRoot = path.join(resourcesDir, 'whisper-models');
  if (!isDirectory(modelRoot)) {
    console.log('Model audit: no bundled whisper-models directory (download-only package)');
    return;
  }

  let modelCount = 0;
  for (const organization of fs.readdirSync(modelRoot, { withFileTypes: true })) {
    if (!organization.isDirectory() || organization.name.startsWith('.')) continue;
    const organizationDir = path.join(modelRoot, organization.name);
    for (const model of fs.readdirSync(organizationDir, { withFileTypes: true })) {
      if (!model.isDirectory() || model.name.startsWith('.')) continue;
      const modelId = `${organization.name}/${model.name}`;
      validateBundledModel(path.join(organizationDir, model.name), modelId, failures);
      modelCount++;
    }
  }

  if (modelCount === 0) {
    failures.push(`Bundled model directory exists but contains no models: ${modelRoot}`);
  } else {
    console.log(`Model audit: validated ${modelCount} bundled model(s)`);
  }
}

function isWindowsArtifact(unpackedDir) {
  if (/win-unpacked/i.test(path.basename(unpackedDir))) return true;
  try {
    return fs.readdirSync(unpackedDir).some((name) => name.toLowerCase().endsWith('.exe'));
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--') args.shift();
  const argument = args[0];
  if (!argument) {
    throw new Error('Usage: pnpm verify:package -- <unpacked-dir>');
  }

  const unpackedDir = path.resolve(argument);
  if (!isDirectory(unpackedDir)) {
    throw new Error(`Unpacked application directory does not exist: ${unpackedDir}`);
  }
  const resourcesDir = path.join(unpackedDir, 'resources');
  if (!isDirectory(resourcesDir)) {
    throw new Error(`Electron resources directory does not exist: ${resourcesDir}`);
  }

  const failures = [];
  if (isWindowsArtifact(unpackedDir)) {
    verifyWindowsNativeModules(resourcesDir, failures);
  } else {
    console.log('Native audit: non-Windows artifact, Windows Sharp/ONNX checks skipped');
  }
  verifyBundledModels(resourcesDir, failures);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`ERROR: ${failure}`);
    throw new Error(`Package verification failed with ${failures.length} error(s)`);
  }
  console.log(`Package verification passed: ${unpackedDir}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
