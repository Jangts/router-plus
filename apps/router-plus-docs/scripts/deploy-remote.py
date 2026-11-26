"""Executed over SSH by deploy.mjs; CONFIG is supplied in the same stdin."""
import fcntl
import hashlib
import pathlib
import re
import shutil
import tarfile
import tempfile

root = pathlib.Path(CONFIG['pagesRoot'])
site = CONFIG['site']
archive = pathlib.Path(CONFIG['upload'])
if not root.is_absolute() or not re.fullmatch(r'[a-z0-9-]+', site):
    raise ValueError('Invalid Pages target')
if not root.is_dir() or not (root / '.shared/404.html').is_file():
    raise ValueError('Pages must be configured before publishing')

# Keep one lock file per site so overlapping publishers share the same inode.
with (root / ('.deploy-' + site + '.lock')).open('a') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    stage = pathlib.Path(tempfile.mkdtemp(prefix='.deploy-' + site + '-', dir=root))
    previous = stage.with_name(stage.name + '.previous')
    target = root / site
    try:
        if hashlib.sha256(archive.read_bytes()).hexdigest() != CONFIG['digest']:
            raise ValueError('Upload checksum mismatch')
        with tarfile.open(archive, 'r:gz') as bundle:
            for member in bundle.getmembers():
                if not (member.isfile() or member.isdir()):
                    raise ValueError('Archive contains a non-regular entry')
                name = pathlib.PurePosixPath(member.name)
                if name.is_absolute() or '..' in name.parts:
                    raise ValueError('Archive entry leaves the site directory')
            bundle.extractall(stage)
        actual = {}
        for path in stage.rglob('*'):
            if path.is_file():
                actual[str(path.relative_to(stage))] = hashlib.sha256(path.read_bytes()).hexdigest()
            path.chmod(0o755 if path.is_dir() else 0o644)
        if actual != CONFIG['files'] or not (stage / 'index.html').stat().st_size:
            raise ValueError('Published files differ from the build')
        stage.chmod(0o755)
        if target.is_symlink() or (target.exists() and not target.is_dir()):
            raise ValueError('Refusing to replace a non-directory site')
        if target.exists():
            target.rename(previous)
        try:
            stage.rename(target)
        except BaseException:
            if previous.exists():
                previous.rename(target)
            raise
        if previous.exists():
            shutil.rmtree(previous)
        print('Published', site, '-', len(actual), 'verified files', flush=True)
    finally:
        if stage.exists():
            shutil.rmtree(stage)
        archive.unlink(missing_ok=True)