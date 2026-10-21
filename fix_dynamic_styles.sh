cat << 'INNEREOF' > dynamic_replace.txt
  // Dynamic color theme styling based on the logged-in user's role
  const dynamicStyles = useMemo(() => {
    return {};
  }, [currentUser, themeMode]);
INNEREOF

sed -i -e '1809,1892c\' -e "$(cat dynamic_replace.txt)" src/App.tsx
