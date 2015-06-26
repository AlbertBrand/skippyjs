init
 - onderscheid spec & code
 - instrument all specs
 - boot http server
 - no test coverage bepalen
 - per spec coverage bepalen
 - link bepalen spec files en code files

file watcher
 - if spec: instrument single spec & run single spec
 - else code: bepaal welke specs gerunt moeten worden en run

output genereren van gerunde test


-- parallelisatie (createPage of phantom proces)
-- link met 'it' block en code files (ipv spec files met code files)
-- api beschikbaar voor file changes
-- console.log & jasmin output




{
files: [
 'src/file1.js': [
    'src/file1.spec.js',
    'integration.spec.js'
 ],
 'src/file2.js: [
    'src/file2.spec.js',
    'integration.spec.js'
 ]
]
}