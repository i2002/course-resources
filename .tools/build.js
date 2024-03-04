// import dependencies
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const fse = require('fs-extra');
const archiver = require('archiver');

// setup config
const build_dir = 'dist/';
const tmp_dir = path.join(build_dir, 'tmp/');

// actions config
const copy_build = [
    'resources/',
    'lang/',
    'include/',
	'.eslintrc',
    'composer.json',
    'composer.lock',
    'course-resources.php',
    'package.json',
    'package-lock.json',
	'postcss.config.js',
    'README.md',
	'tailwind.config.js',
	'tsconfig.json',
    'webpack.config.js'
];

const remove_archive = [
    'resources/',
    'node_modules/',
    '.eslintrc',
    'composer.json',
    'composer.lock',
    'package.json',
    'package-lock.json',
	'postcss.config.js',
	'tailwind.config.js',
	'tsconfig.json',
    'webpack.config.js'
];

const build_actions = [
    `npm --prefix=../../ run composer install -- -d ./${tmp_dir}`,
    'npm install',
    'npm run build'
]

// print colored text
function print(text) {
    console.log('\x1b[1m\x1b[94m%s\x1b[0m', text);
}

// functions
function run() {
    copy_files();
    run_scripts();
    remove_build();
    create_archive();
}

function copy_files() {
    print('-> Copying files')

    // create build and tmp dirs
    cleanup();
    fs.mkdirSync(tmp_dir, {recursive: true});

    // copy files
    copy_build.forEach(copy => fse.copySync(copy, path.join(tmp_dir, path.basename(copy))));

    // copy production config
    // fse.copySync('.env.prod', path.join(tmp_dir, '.env'));
}

function run_scripts() {
    // run build actions
    build_actions.forEach(action => {
        print(`-> Running ${action}`);
        child_process.execSync(action, {cwd: tmp_dir, stdio: [0, 1, 2]});
        print('--------------------------------------------------------------------------------\n');
    });
}

function remove_build() {
    print('-> Cleanup deployment files');

    // remove files not needed for deployment
    remove_archive.forEach(remove => {
        if(fs.lstatSync(path.join(tmp_dir, remove)).isDirectory()) {
            fs.rmSync(path.join(tmp_dir, remove), {recursive: true})
        } else {
            fs.unlinkSync(path.join(tmp_dir, remove));
        }
    });
}

function create_archive() {
    print('-> Creating archive');
    let archive_name = `${process.env.npm_package_name}_v${process.env.npm_package_version}.zip`;

    // create archive file
    let output = fs.createWriteStream(path.join(build_dir, archive_name));
    let archive = archiver('zip');

    // handle warnings and errors
    archive.on('warning', (err) => {if(err.code !== 'ENOENT') throw err; console.warn(err)});
    archive.on('error', (err) => {throw err});
    
    // insert content
    archive.pipe(output);
    archive.directory(tmp_dir, process.env.npm_package_name, );

    // close archive
    output.on('close', () => {
        print(`   Archive created: ${archive_name}`)
        cleanup();
    });
    archive.finalize();
}

function cleanup() {
    // cleanup tmp dir
    if(fs.existsSync(tmp_dir)) {
        print('-> Cleanup tmp dir');        
        fs.rmSync(tmp_dir, {recursive: true});
    }
}

// run build
run();
