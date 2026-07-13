with open('models_new.txt', 'rb') as f:
    content = f.read().decode('utf-16le')
    for line in content.splitlines():
        if 'models/' in line:
            print(line.strip())
