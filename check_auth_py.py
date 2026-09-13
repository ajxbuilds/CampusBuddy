with open("auth_backup.py", "r", encoding="utf-8") as f:
    content = f.read()
    if "link-code/generate" in content:
        print("Found generate endpoint")
    if "get_parent_link_code" in content:
        print("Found get endpoint")
