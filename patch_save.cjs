const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                  const nameAmhClean = editWsNameAmh.trim() || item.nameAmh;
                                  const nameEngClean = editWsNameEng.trim() || item.nameEng;

                                  const updatedRegistry = workspacesRegistry.map(w => {
                                    if (w.id === item.id) {
                                      return { ...w, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                    }
                                    return w;
                                  });
                                  setWorkspacesRegistry(updatedRegistry);
                                  localStorage.setItem('school_workspaces_registry', JSON.stringify(updatedRegistry));

                                  // If active school is edited, update the active schoolConfig and sync
                                  if (isActive) {
                                    setWlNameAmh(nameAmhClean);
                                    setWlNameEng(nameEngClean);
                                    setSchoolConfig(prev => {
                                      const next = { ...prev, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                      localStorage.setItem(\`schoolConfig_\${schoolWorkspaceId}\`, JSON.stringify(next));
                                      localStorage.setItem('schoolConfig', JSON.stringify(next));
                                      
                                      // Sync to Firestore
                                      setDoc(doc(db, 'schools', schoolWorkspaceId, 'config', 'school'), cleanForFirestore(next)).catch(err => {
                                        console.error('Failed to sync updated edited name to Firestore:', err);
                                      });
                                      return next;
                                    });
                                  } else {
                                    // Update the target school's specific config in localStorage/Firestore if exists
                                    const savedStr = localStorage.getItem(\`schoolConfig_\${item.id}\`);
                                    if (savedStr) {
                                      try {
                                        const parsed = JSON.parse(savedStr);
                                        parsed.nameAmh = nameAmhClean;
                                        parsed.nameEng = nameEngClean;
                                        localStorage.setItem(\`schoolConfig_\${item.id}\`, JSON.stringify(parsed));
                                        
                                        // Sync to Firestore
                                        setDoc(doc(db, 'schools', item.id, 'config', 'school'), cleanForFirestore(parsed)).catch(err => {
                                          console.error('Failed to sync updated edited name to Firestore for non-active school:', err);
                                        });
                                      } catch (e) {}
                                    }
                                  }

                                  setEditingWorkspaceId(null);`;

const rep = `                                  const nameAmhClean = editWsNameAmh.trim() || item.nameAmh;
                                  const nameEngClean = editWsNameEng.trim() || item.nameEng;
                                  let newId = editWsId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                                  if (!newId || newId.length < 3) newId = item.id;
                                  
                                  if (newId !== item.id && workspacesRegistry.some(w => w.id === newId)) {
                                    alert('A school with this ID already exists!');
                                    return;
                                  }

                                  const updatedRegistry = workspacesRegistry.map(w => {
                                    if (w.id === item.id) {
                                      return { ...w, id: newId, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                    }
                                    return w;
                                  });
                                  
                                  // Migrate localStorage if ID changed
                                  if (newId !== item.id) {
                                    const keysToMigrate = [
                                      'schoolConfig',
                                      'school_students',
                                      'school_grades',
                                      'school_teachers',
                                      'school_classes',
                                      'school_announcements',
                                      'studentExtraInfo',
                                      'school_user_accounts'
                                    ];
                                    keysToMigrate.forEach(k => {
                                      const oldKey = \`\${k}_\${item.id}\`;
                                      const newKey = \`\${k}_\${newId}\`;
                                      const data = localStorage.getItem(oldKey);
                                      if (data !== null) {
                                        localStorage.setItem(newKey, data);
                                        localStorage.removeItem(oldKey);
                                      }
                                    });
                                  }

                                  setWorkspacesRegistry(updatedRegistry);
                                  localStorage.setItem('school_workspaces_registry', JSON.stringify(updatedRegistry));

                                  // If active school is edited, update the active schoolConfig and sync
                                  if (isActive) {
                                    setWlNameAmh(nameAmhClean);
                                    setWlNameEng(nameEngClean);
                                    if (newId !== item.id) {
                                      setSchoolWorkspaceId(newId);
                                      localStorage.setItem('school_workspace_id', newId);
                                      const newUrl = \`\${window.location.origin}\${window.location.pathname}?school=\${newId}\`;
                                      window.history.pushState({ path: newUrl }, '', newUrl);
                                    }
                                    setSchoolConfig(prev => {
                                      const next = { ...prev, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                      localStorage.setItem(\`schoolConfig_\${newId}\`, JSON.stringify(next));
                                      localStorage.setItem('schoolConfig', JSON.stringify(next));
                                      
                                      // Sync to Firestore
                                      setDoc(doc(db, 'schools', newId, 'config', 'school'), cleanForFirestore(next)).catch(err => {
                                        console.error('Failed to sync updated edited name to Firestore:', err);
                                      });
                                      return next;
                                    });
                                  } else {
                                    // Update the target school's specific config in localStorage/Firestore if exists
                                    const savedStr = localStorage.getItem(\`schoolConfig_\${newId}\`);
                                    if (savedStr) {
                                      try {
                                        const parsed = JSON.parse(savedStr);
                                        parsed.nameAmh = nameAmhClean;
                                        parsed.nameEng = nameEngClean;
                                        localStorage.setItem(\`schoolConfig_\${newId}\`, JSON.stringify(parsed));
                                        
                                        // Sync to Firestore
                                        setDoc(doc(db, 'schools', newId, 'config', 'school'), cleanForFirestore(parsed)).catch(err => {
                                          console.error('Failed to sync updated edited name to Firestore for non-active school:', err);
                                        });
                                      } catch (e) {}
                                    }
                                  }

                                  setEditingWorkspaceId(null);`;

code = code.replace(target, rep);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched Save button logic');
