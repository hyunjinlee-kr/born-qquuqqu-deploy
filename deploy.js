/**
 * gh-pages 배포 스크립트
 * dist/ 폴더 내용만 gh-pages 브랜치에 push합니다.
 * 사용: npm run deploy
 */
import { execSync } from 'child_process'
import { mkdtempSync, cpSync, rmSync, readdirSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

// 현재 브랜치 기억
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

// dist 파일 목록을 미리 수집
function getAllFiles(dir, base = '') {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = base ? `${base}/${entry}` : entry
    if (statSync(full).isDirectory()) {
      results.push(...getAllFiles(full, rel))
    } else {
      results.push(rel)
    }
  }
  return results
}

// 1. dist 파일 목록 수집 후 임시 폴더에 복사
const distFiles = getAllFiles('dist')
const tmp = mkdtempSync(join(tmpdir(), 'gh-pages-'))
cpSync('dist', tmp, { recursive: true })

// 2. gh-pages 브랜치 전환 (없으면 생성)
try {
  run('git checkout gh-pages')
} catch {
  run('git checkout --orphan gh-pages')
  run('git rm -rf .')
}

// 3. 기존 tracked 파일 정리 후 dist 내용만 복사
run('git rm -rf . --ignore-unmatch -q')
cpSync(tmp, '.', { recursive: true })
rmSync(tmp, { recursive: true })

// 4. dist에서 복사된 파일만 명시적으로 add (node_modules 등 제외)
const filesToAdd = distFiles.map(f => `"${f}"`).join(' ')
run(`git add ${filesToAdd}`)

// 5. 커밋 & push
try {
  run('git commit -m "deploy: update gh-pages"')
} catch {
  console.log('No changes to deploy')
}
run('git push origin gh-pages --force')

// 6. 원래 브랜치로 복귀
run(`git checkout ${currentBranch}`)

console.log('\n✅ Deployed to gh-pages!')
