with open("auth_backup.py", "r", encoding="utf-16") as f:
    try:
        content = f.read()
        if "link-code/generate" in content:
            print("Found generate endpoint (UTF-16)")
        if "get_parent_link_code" in content:
            print("Found get endpoint (UTF-16)")
    except Exception as e:
        print("Not UTF-16", e)
